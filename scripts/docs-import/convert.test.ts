import { convertPage, docsRoute, humanbaseSpelling, imageSize, linkedSources, pipeTable, rewriteHref } from './convert.ts';
import { pages } from './pages.ts';

const page = (body: string) => `<html><body><div role="main"><div itemprop="articleBody">${body}</div></div><footer></footer></body></html>`;
const sei = pages.find((config) => config.slug === 'sei');
const useCase = pages.find((config) => config.slug === 'use-cases/sei-use-case');
if (!sei || !useCase) throw new Error('pages.ts is missing Sei or its use case');

describe('rewriteHref', () => {
  it('maps live page names to our routes and keeps anchors', () => {
    expect(rewriteHref('sei.html#output', 'deepsea.html')).toBe('/docs/sei/#output');
    expect(rewriteHref('use-cases/sei-use-case.html', 'use-cases.html')).toBe('/docs/use-cases/sei-use-case/');
    expect(rewriteHref('../beluga.html', 'use-cases/sei-use-case.html')).toBe('/docs/beluga/');
    expect(rewriteHref('index.html', 'sei.html')).toBe('/docs/');
    expect(rewriteHref('https://humanbase.readthedocs.io/en/latest/netwas.html', 'sei.html')).toBe('/docs/netwas/');
  });

  it('leaves external links and in-page anchors alone', () => {
    expect(rewriteHref('https://www.nature.com/articles/s41588-022-01102-2', 'sei.html')).toBe('https://www.nature.com/articles/s41588-022-01102-2');
    expect(rewriteHref('#output', 'sei.html')).toBe('#output');
  });

  it('builds routes with a trailing slash', () => {
    expect(docsRoute('')).toBe('/docs/');
    expect(docsRoute('sei')).toBe('/docs/sei/');
  });
});

describe('humanbaseSpelling', () => {
  it('spells the name Humanbase in prose', () => {
    expect(humanbaseSpelling('HumanBase is a resource. Thus, HumanBase’s tools')).toBe('Humanbase is a resource. Thus, Humanbase’s tools');
  });

  it('keeps URLs and quoted titles as written', () => {
    expect(humanbaseSpelling('see https://HumanBase.io/x and www.HumanBase.org')).toBe('see https://HumanBase.io/x and www.HumanBase.org');
    expect(humanbaseSpelling('the paper “HumanBase: a tool” by HumanBase')).toBe('the paper “HumanBase: a tool” by Humanbase');
  });
});

describe('convertPage', () => {
  it('keeps every heading id and drops the permalink icons', () => {
    const { markdown, frontMatter } = convertPage(
      page('<section id="sei"><h1>Sei<a class="headerlink" href="#sei">¶</a></h1><section id="output"><h2>Output<a class="headerlink" href="#output"></a></h2><p>Text</p></section></section>'),
      sei,
    );
    expect(markdown).toContain('# Sei {#sei}');
    expect(markdown).toContain('## Output {#output}');
    expect(markdown).not.toContain('¶');
    expect(frontMatter.sections).toEqual([
      { id: 'sei', title: 'Sei', level: 1 },
      { id: 'output', title: 'Output', level: 2 },
    ]);
  });

  it('rewrites internal links and respells prose, but not code or paper titles', () => {
    const { markdown } = convertPage(
      page(
        '<section id="sei"><h1>Sei</h1><p>HumanBase runs <a class="reference internal" href="beluga.html#output">Beluga</a>, see <a class="reference external" href="https://doi.org/x">HumanBase paper</a> and <code class="docutils literal"><span class="pre">HumanBase</span></code>.</p></section>',
      ),
      sei,
    );
    expect(markdown).toContain('Humanbase runs [Beluga](/docs/beluga/#output)');
    expect(markdown).toContain('[HumanBase paper](https://doi.org/x)');
    expect(markdown).toContain('`HumanBase`');
  });

  it('turns math into $ and $$ formulas and sub elements into subscripts', () => {
    const { markdown } = convertPage(
      page('<section id="sei"><h1>Sei</h1><p>Score (<span class="math notranslate nohighlight">\\(p_{alt} -p_{ref}\\)</span>) for p<sub>ij</sub></p><div class="math notranslate nohighlight">\n\\[\\sum x / N\\]</div></section>'),
      sei,
    );
    expect(markdown).toContain('($p_{alt} -p_{ref}$)');
    expect(markdown).toContain('p$_{ij}$');
    expect(markdown).toContain('$$\n\\sum x / N\n$$');
  });

  it('downloads figures under /docs/img/ and names screenshots whose alt text is a file path', () => {
    const { markdown, images } = convertPage(
      page('<section id="sei-use-case"><h1>Sei use case</h1><figure class="align-center"><a class="reference internal image-reference" href="../_images/sei-1.png"><img alt="../_images/sei-1.png" src="../_images/sei-1.png" /></a></figure></section>'),
      useCase,
    );
    expect(images).toEqual([{ url: 'https://humanbase.readthedocs.io/en/latest/_images/sei-1.png', file: 'sei-1.png' }]);
    expect(markdown).toContain('![Sei use case, screenshot 1](/docs/img/sei-1.png)');
  });

  it('keeps code blocks as code', () => {
    const { markdown } = convertPage(page('<section id="sei"><h1>Sei</h1><div class="highlight-default notranslate"><div class="highlight"><pre><span></span># HumanBase NetWAS\nKRT6B  -1\n</pre></div></div></section>'), sei);
    expect(markdown).toContain('```\n# HumanBase NetWAS\nKRT6B  -1\n```');
  });
});

describe('pipeTable', () => {
  it('turns a preformatted pipe table into a table with the same cells', () => {
    const table = pipeTable('| Label | Name | Rank |\n|---:|---:|---:|\n|  PC1 | Polycomb / Heterochromatin |  0 |\n|   L1 |  Low signal |  1 |');
    expect(table?.align).toEqual([null, null, 'right']);
    expect(table?.children.map((row) => row.children.map((cell) => (cell.children[0] as { value: string } | undefined)?.value))).toEqual([
      ['Label', 'Name', 'Rank'],
      ['PC1', 'Polycomb / Heterochromatin', '0'],
      ['L1', 'Low signal', '1'],
    ]);
  });

  it('leaves other preformatted text alone', () => {
    expect(pipeTable('chr1  762318  G  A')).toBeUndefined();
  });
});

describe('linkedSources', () => {
  it('finds the live pages a page links to', () => {
    expect(linkedSources('<a href="reproducibility.html#x">a</a><a href="_static/x.html">b</a><a href="https://example.org/y.html">c</a>', 'modules.html')).toEqual(['reproducibility.html']);
  });
});

describe('imageSize', () => {
  it('reads a PNG header', () => {
    const png = new Uint8Array(24);
    png.set([0x89, 0x50, 0x4e, 0x47]);
    new DataView(png.buffer).setUint32(16, 600);
    new DataView(png.buffer).setUint32(20, 400);
    expect(imageSize(png)).toEqual([600, 400]);
  });
});
