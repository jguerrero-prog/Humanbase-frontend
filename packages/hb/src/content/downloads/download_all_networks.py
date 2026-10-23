#!/usr/bin/env python3

"""
HumanBase Tissue-Specific Functional Network Batch Download Script

This script systematically downloads all tissue-specific functional interaction
networks from the HumanBase database. Each network consists of three file types:
1. Top edges: High-confidence tissue-specific functional interactions (*_top.gz)
2. Full network: Complete probability-weighted interaction network (*.gz)
3. Gold standard: Training/validation datasets used for network construction (*.dat)

Usage: python download_all_networks.py [OPTIONS]
Options:
  --top-edges     Download only top edges files (*_top.gz)
  --full-network  Download only full network files (*.gz)
  --gold          Download only gold standard files (*.dat)
  --help, -h      Show this help message

If no options are specified, all file types will be downloaded.
Multiple options can be combined to download specific subsets.

Examples:
  python download_all_networks.py                    # Download all files
  python download_all_networks.py --gold             # Only gold standards
  python download_all_networks.py --top-edges        # Only top edges
  python download_all_networks.py --gold --full-network  # Gold + full networks

Output: All network files organized by type in ./humanbase_networks/

Reference: Greene et al. (2015) Understanding multicellular function and disease
with human tissue-specific networks. Nat Genet. 47(6):569-76.
"""

import argparse
import concurrent.futures
import json
import re
import sys
import time
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path
from typing import Dict, List, Optional, Tuple


class HumanBaseDownloader:
    """Downloads HumanBase tissue-specific networks with progress tracking."""

    def __init__(self):
        self.networks_base_url = "https://s3-us-west-2.amazonaws.com/humanbase/networks"
        self.standards_base_url = "https://s3-us-west-2.amazonaws.com/humanbase/standards"
        self.api_endpoint = "https://humanbase.io/api/integrations/"
        self.output_dir = Path("./humanbase_networks")

        # In-memory cache for file sizes (no temporary files)
        self.size_cache: Dict[str, Tuple[int, int]] = {}  # url -> (size, status_code)

        # Track failed downloads for detailed reporting
        self.failed_downloads: List[Tuple[str, str]] = []  # (filename, error_msg)

        self.skip_list = {
            "global.dat": "File does not exist"
        }

    def parse_arguments(self) -> argparse.Namespace:
        """Parse command line arguments."""
        parser = argparse.ArgumentParser(
            description="HumanBase Tissue-Specific Network Batch Download Script",
            formatter_class=argparse.RawDescriptionHelpFormatter,
            epilog="""
Examples:
  %(prog)s                          # Download all files
  %(prog)s --gold                   # Only gold standards
  %(prog)s --top-edges              # Only top edges
  %(prog)s --gold --full-network    # Gold + full networks
            """
        )

        parser.add_argument(
            "--top-edges",
            action="store_true",
            help="Download only top edges files (*_top.gz)"
        )
        parser.add_argument(
            "--full-network",
            action="store_true",
            help="Download only full network files (*.gz)"
        )
        parser.add_argument(
            "--gold",
            action="store_true",
            help="Download only gold standard files (*.dat)"
        )

        return parser.parse_args()

    def should_skip_file(self, filename: str) -> Optional[str]:
        """Check if a file should be skipped. Returns skip reason if yes, None if no."""
        return self.skip_list.get(filename)

    def get_network_names(self) -> List[str]:
        """Query HumanBase API for available tissue-specific networks."""
        print("Querying HumanBase API for available tissue-specific networks...")

        try:
            with urllib.request.urlopen(self.api_endpoint, timeout=30) as response:
                data = json.loads(response.read().decode())
        except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError) as e:
            print(f"ERROR: Failed to retrieve network list from API: {e}")
            sys.exit(1)

        # Filter and process network names similar to jq in bash script
        networks = []
        for item in data:
            context = item.get("context", {})
            if not context:
                continue

            # Safely get term database slug
            term = context.get("term")
            term_db = ""
            if term and isinstance(term, dict):
                database = term.get("database")
                if database and isinstance(database, dict):
                    term_db = database.get("slug", "")

            title = context.get("title", "")

            if term_db == "brenda-ontology" or title == "global":
                # Clean up title similar to bash script
                clean_title = title.replace(" ", "_")
                clean_title = re.sub(r"[-,:,=,+]", "_", clean_title)
                clean_title = re.sub(r"__+", "_", clean_title)
                clean_title = clean_title.lower()
                networks.append(clean_title)

        if not networks:
            print("ERROR: No networks found from API")
            sys.exit(1)

        return sorted(set(networks))  # Remove duplicates and sort

    def get_remote_size(self, url: str) -> Tuple[int, int]:
        """Get remote file size in bytes using HEAD request. Returns (size, status_code)."""
        try:
            req = urllib.request.Request(url, method='HEAD')
            with urllib.request.urlopen(req, timeout=10) as response:
                size_header = response.headers.get('content-length')
                return (int(size_header) if size_header else 0, 200)
        except urllib.error.HTTPError as e:
            return (0, e.code)
        except (urllib.error.URLError, ValueError, OSError):
            return (0, 0)  # 0 = network/timeout error

    def format_bytes(self, bytes_size: int) -> str:
        """Format bytes as human readable string."""
        if bytes_size == 0:
            return "0 B"

        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if bytes_size < 1024.0:
                if unit == 'B':
                    return f"{bytes_size} {unit}"
                else:
                    return f"{bytes_size:.1f} {unit}"
            bytes_size /= 1024.0
        return f"{bytes_size:.1f} PB"

    def calculate_total_size(self, file_urls: List[Tuple[str, Path, str]]) -> int:
        """Calculate total download size using parallel HEAD requests."""
        print("Calculating total download size (using parallel requests)...")

        total_size = 0
        max_workers = 20  # Limit concurrent connections

        def check_size(url_info):
            url, filepath, _ = url_info
            filename = filepath.name
            
            # Check if this file should be skipped
            skip_reason = self.should_skip_file(filename)
            if skip_reason:
                self.size_cache[url] = (-1, -1)  # Special marker for skipped files
                return 0
            
            size, status_code = self.get_remote_size(url)
            self.size_cache[url] = (size, status_code)  # Cache for later use
            return size

        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all size check jobs
            future_to_url = {executor.submit(check_size, url_info): url_info for url_info in file_urls}

            completed = 0
            for future in concurrent.futures.as_completed(future_to_url):
                size = future.result()
                if size > 0:
                    total_size += size
                completed += 1
                print(f"\rChecking file sizes... [{completed}/{len(file_urls)}]", end="", flush=True)

        print()  # New line after progress
        return total_size

    def download_file(self, url: str, filepath: Path, description: str,
                     file_number: int, total_files: int) -> bool:
        """Download a single file with progress tracking."""
        print(f"[{file_number:3d}/{total_files}] {description}")

        # Check if this file should be skipped
        filename = filepath.name
        skip_reason = self.should_skip_file(filename)
        if skip_reason:
            print(f"  ⊘ SKIP: {skip_reason}")
            return True  # Count as successful since it's intentionally skipped

        # Get cached remote file size and status (avoid redundant HTTP requests)
        cached_info = self.size_cache.get(url, (0, 0))
        remote_size, status_code = cached_info
        remote_size_human = self.format_bytes(remote_size)

        # Check if remote file exists, with retry logic for network errors
        if remote_size == 0:
            filename = filepath.name
            if status_code == 0:  # Network/timeout error - try retries
                print(f"  ⚠ Network/timeout error, retrying...")
                for retry_num in range(2):  # 2 retries
                    print(f"  → Retry {retry_num + 1}/2...")
                    time.sleep(1)  # Brief pause before retry
                    retry_size, retry_status = self.get_remote_size(url)
                    if retry_size > 0:
                        # Success on retry - update cache and continue
                        self.size_cache[url] = (retry_size, retry_status)
                        remote_size = retry_size
                        remote_size_human = self.format_bytes(remote_size)
                        print(f"  ✓ Retry successful - file size: {remote_size_human}")
                        break
                else:
                    # All retries failed
                    print(f"  ✗ FAILED: Network/timeout error (after 2 retries)")
                    self.failed_downloads.append((filename, "Network/timeout error (after 2 retries)"))
                    return False
            else:
                # HTTP error (403, 404, etc.) - don't retry
                error_msg = f"HTTP {status_code}"
                print(f"  ✗ FAILED: {error_msg}")
                self.failed_downloads.append((filename, error_msg))
                return False

        # Check if file already exists and compare sizes
        if filepath.exists():
            local_size = filepath.stat().st_size
            local_size_human = self.format_bytes(local_size)

            if local_size == remote_size:
                print(f"  ✓ SKIP: File already downloaded ({remote_size_human})")
                return True
            elif local_size > 0:
                print(f"  ⚠ PARTIAL: Local {local_size_human}, remote {remote_size_human} - redownloading")
                filepath.unlink()  # Remove partial file
            else:
                print(f"  ⚠ EMPTY: Local file is empty, redownloading")
                filepath.unlink()

        # Create parent directory
        filepath.parent.mkdir(parents=True, exist_ok=True)

        # Download file with progress
        try:
            with urllib.request.urlopen(url, timeout=300) as response:
                # Write to temporary file first, then move to final location
                temp_filepath = filepath.with_suffix(filepath.suffix + '.tmp')
                
                with open(temp_filepath, 'wb') as f:
                    downloaded = 0
                    last_update = time.time()

                    while True:
                        chunk = response.read(8192)
                        if not chunk:
                            break
                        f.write(chunk)
                        downloaded += len(chunk)
                        
                        # Update progress every 0.1 seconds or on last chunk
                        current_time = time.time()
                        if current_time - last_update >= 0.1 or downloaded == remote_size:
                            if remote_size > 0:
                                percent = (downloaded / remote_size) * 100
                                downloaded_human = self.format_bytes(downloaded)
                                print(f"\r  → Downloading {downloaded_human}/{remote_size_human} ({percent:.1f}%)", end="", flush=True)
                                last_update = current_time

                    # Ensure we end on a new line
                    if remote_size > 0:
                        print()

                # Verify download size
                if temp_filepath.stat().st_size != remote_size:
                    temp_filepath.unlink()
                    print(f"  ✗ FAILED: Size mismatch after download")
                    return False

                # Move temp file to final location
                temp_filepath.rename(filepath)
                print(f"  ✓ SUCCESS: Downloaded {remote_size_human}")
                return True

        except (urllib.error.URLError, urllib.error.HTTPError, OSError) as e:
            if filepath.with_suffix(filepath.suffix + '.tmp').exists():
                filepath.with_suffix(filepath.suffix + '.tmp').unlink()
            print(f"  ✗ FAILED: {e}")
            return False

    def run(self):
        """Main download process."""
        args = self.parse_arguments()

        # Determine which file types to download
        download_top_edges = args.top_edges
        download_full_networks = args.full_network
        download_gold_standards = args.gold

        # If no specific flags provided, download all types
        if not any([download_top_edges, download_full_networks, download_gold_standards]):
            download_top_edges = download_full_networks = download_gold_standards = True

        # Create output directory structure
        if download_top_edges:
            (self.output_dir / "top_edges").mkdir(parents=True, exist_ok=True)
        if download_full_networks:
            (self.output_dir / "networks").mkdir(parents=True, exist_ok=True)
        if download_gold_standards:
            (self.output_dir / "standards").mkdir(parents=True, exist_ok=True)

        # Clean up any partial downloads (.tmp files)
        print("Cleaning up any partial downloads from previous runs...")
        for tmp_file in self.output_dir.rglob("*.tmp"):
            tmp_file.unlink()
        print()

        # Display configuration
        print("HumanBase Tissue-Specific Network Batch Downloader")
        print("=" * 50)
        print(f"Date: {time.strftime('%c')}")
        print(f"Networks URL: {self.networks_base_url}")
        print(f"Standards URL: {self.standards_base_url}")
        print(f"Output directory: {self.output_dir}")
        print()

        # Get network names from API
        networks = self.get_network_names()
        network_count = len(networks)
        print(f"Retrieved {network_count:8d} tissue-specific networks from database")

        # Calculate total expected files
        file_types_count = sum([download_top_edges, download_full_networks, download_gold_standards])
        total_expected_files = network_count * file_types_count
        print(f"Will process {file_types_count} file type(s) × {network_count:6d} networks = {total_expected_files} total files")
        print()

        # Build list of all files to download
        file_urls = []
        for network in networks:
            if download_top_edges:
                url = f"{self.networks_base_url}/{network}_top.gz"
                filepath = self.output_dir / "top_edges" / f"{network}_top.gz"
                description = f"Top edges: {network}_top.gz"
                file_urls.append((url, filepath, description))

            if download_full_networks:
                url = f"{self.networks_base_url}/{network}.gz"
                filepath = self.output_dir / "networks" / f"{network}.gz"
                description = f"Full network: {network}.gz"
                file_urls.append((url, filepath, description))

            if download_gold_standards:
                url = f"{self.standards_base_url}/{network}.dat"
                filepath = self.output_dir / "standards" / f"{network}.dat"
                description = f"Gold standard: {network}.dat"
                file_urls.append((url, filepath, description))

        # Calculate total download size
        total_size = self.calculate_total_size(file_urls)
        print(f"Total download size: {self.format_bytes(total_size)}")
        print()

        # Add informational note if no flags were provided
        if not any([args.top_edges, args.full_network, args.gold]):
            print("NOTE: No specific file type flags were provided.")
            print("Downloading all file types (--top-edges, --full-network, --gold).")
            print("Use specific flags to download only certain file types.")
            print()

        # Confirm with user
        if total_size > 0:
            try:
                response = input(f"Download {len(file_urls)} files totaling {self.format_bytes(total_size)}? [y/N]: ")
                if response.lower() not in ['y', 'yes']:
                    print("Download cancelled.")
                    sys.exit(0)
            except KeyboardInterrupt:
                print("\nDownload cancelled.")
                sys.exit(0)
        else:
            print("No files to download (all files may already exist or are unavailable).")
            sys.exit(0)

        print()

        # Download all files
        print("Beginning download process...")
        print()

        successful = 0
        failed = 0
        skipped_existing = 0
        skipped_intentional = 0

        for i, (url, filepath, description) in enumerate(file_urls, 1):

            # Check if this file is intentionally skipped
            filename = filepath.name
            skip_reason = self.should_skip_file(filename)
            if skip_reason:
                skipped_intentional += 1
                print(f"[{i:3d}/{len(file_urls)}] {description}")
                print(f"  ⊘ SKIP: {skip_reason}")
                continue

            # Check if already exists and is complete
            if filepath.exists():
                cached_info = self.size_cache.get(url, (0, 0))
                remote_size, _ = cached_info
                local_size = filepath.stat().st_size
                if local_size == remote_size and remote_size > 0:
                    skipped_existing += 1
                    print(f"[{i:3d}/{len(file_urls)}] {description}")
                    print(f"  ✓ SKIP: File already downloaded ({self.format_bytes(remote_size)})")
                    continue

            success = self.download_file(url, filepath, description, i, len(file_urls))
            if success:
                successful += 1
            else:
                failed += 1

        # Final summary
        print()
        print("Download Summary")
        print("=" * 50)
        print(f"Total files processed: {len(file_urls)}")
        print(f"Successful downloads: {successful}")
        print(f"Files skipped (already downloaded): {skipped_existing}")
        print(f"Files skipped (intentionally): {skipped_intentional}")
        print(f"Failed downloads: {failed}")

        # Show intentionally skipped files if any
        if skipped_intentional > 0:
            print()
            print("Intentionally Skipped Files:")
            print("-" * 30)
            for filename, reason in self.skip_list.items():
                print(f"  {filename}: {reason}")

        # Show detailed information for failed downloads
        if self.failed_downloads:
            print()
            print("Failed Downloads:")
            print("-" * 30)
            for filename, reason in self.failed_downloads:
                print(f"  {filename}: {reason}")
            sys.exit(1)
        else:
            print()
            print("All downloads completed successfully!")


if __name__ == "__main__":
    downloader = HumanBaseDownloader()
    downloader.run()
