export interface paths {
    "/api/compendiums/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Retrieve the list of all compendia */
        get: operations["compendiums_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/compendiums/{slug}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Retrieve a compendium by slug */
        get: operations["compendiums_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/compendiums/{slug}/data/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Retrieve data for a gene pair from a specific compendium. Note: This endpoint only supports `human-compendium` (GIANT v1). MAGE (v3) does not use BNServer and is not supported by this endpoint. */
        get: operations["compendiums_data_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/compendiums/{slug}/datasets/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Retrieves a dictionary of the compendium's dataset titles keyed by their ID. */
        get: operations["compendiums_datasets_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/compendiums/{slug}/search/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Returns a list of dataset IDs matched by the search query */
        get: operations["compendiums_search_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/compendiums/{slug}/terms/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return a list of terms represented in a data compendium */
        get: operations["compendiums_terms_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/databases/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Retrieve the list of all databases. */
        get: operations["databases_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/databases/{slug}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Retrieve a database by slug. */
        get: operations["databases_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/datasets/{slug}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return a given dataset */
        get: operations["datasets_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/datatypes/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Retrieve datatypes available for a GIANT/MAGE version */
        get: operations["datatypes_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/datatypes/{slug}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return a given datatype */
        get: operations["datatypes_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/deepsea/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description List all available DeepSEA models */
        get: operations["deepsea_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/deepsea/{name}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Retrieve a specific DeepSEA model by name */
        get: operations["deepsea_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/deepsea/{name}/feature_predictions/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Returns all feature scores for submitted variants of a chosen model. */
        get: operations["deepsea_feature_predictions_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/deepsea/{name}/features/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Returns the DeepSEA model's associated features. Can optionally add `expecto_features` to response if `expecto` is provided as a URL parameter. */
        get: operations["deepsea_features_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/deepsea/jobs/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Creates a new DeepSEA job instance. */
        post: operations["deepsea_jobs_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/deepsea/jobs/{job_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Returns the job specified by the `job_id`. Use the example `/jobs` **POST** request to create a new job.  The response will contain a `job_id` which you can use with the **GET** APIs to retrieve the job. */
        get: operations["deepsea_jobs_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/deepsea/jobs/{job_id}/feature_predictions/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * @description ## Feature Predictions
         *     Returns all feature predictions for submitted variants of a job.
         */
        get: operations["deepsea_jobs_feature_predictions_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/deepsea/jobs/{job_id}/in_silico_mutagenesis/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * @description ## In Silico Mutagenesis
         *     Returns feature predictions from a finished run of in silico mutagenesis.
         *     ### URL parameters
         *     - `sequence_name`: String name of the submitted sequence.
         *     - `feature_name`: String name of the desired feature value.
         *     - `feature_only`: If set, does not return position, ref, or alt columns.
         *
         *     **Note:** the examples below depend on the in silico mutagenesis example from POST having completed successfully. You must use the `job_id` from the POST response.
         */
        get: operations["deepsea_jobs_in_silico_mutagenesis_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/deepsea/jobs/{job_id}/queue_position/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * @description ## Queue Position
         *     Retrieves the queue position of a specific DeepSEA job.
         */
        get: operations["deepsea_jobs_queue_position_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/deepsea/jobs/{job_id}/score_types/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * @description ## Score Types
         *     Retrieves a list of available score types for a specific DeepSEA job.
         */
        get: operations["deepsea_jobs_score_types_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/deepsea/jobs/{job_id}/sequence_scores/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * @description ## Sequence Scores
         *     Returns a list of sequence/variant scores.
         */
        get: operations["deepsea_jobs_sequence_scores_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/deepsea/jobs/{job_id}/variant_scores/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * @description ## Variant Scores
         *     Retrieves a list of variant scores for a specific DeepSEA job.
         */
        get: operations["deepsea_jobs_variant_scores_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/genes/{entrez}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Retrieve a gene by entrez id */
        get: operations["genes_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/genes/{entrez}/annotations/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Returns a list of terms a gene is annotated to */
        get: operations["genes_annotations_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/genes/{entrez}/predictions/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Returns a list of terms a gene is predicted to be associated with */
        get: operations["genes_predictions_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/genes/{entrez}/tissue_variants/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Returns a matrix (variants by tissues/cell types) of predicted variant effects on gene expression. Supports both ExPecto (tissue-level) and ExPectoSC (primary cell type-specific) predictions. */
        get: operations["genes_tissue_variants_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/integrations/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Returns a list of all network integrations. */
        get: operations["integrations_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/integrations/{slug}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Returns a specific network integration. */
        get: operations["integrations_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/integrations/{slug}/evidence/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * @description ## Integration Evidence
         *     Retrieve the evidence (list of datasets and their contributions) for a gene pair.
         */
        get: operations["integrations_evidence_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/integrations/{slug}/network/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * @description ## Network
         *     Query a functional network and return the relevant gene subnetwork.
         */
        get: operations["integrations_network_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/integrations/community/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * @description Submit a gene list for community detection and poll for the result.
         *
         *     **Asynchronous flow:**
         *
         *     1. First POST with `entrez` body and `body_tag` query param: the Celery task is submitted and the endpoint returns `202 Accepted` with `{"status": "processing"}` immediately. The client must then poll.
         *     2. Subsequent POSTs with the same `body_tag` (empty body): return `202` while the task is still running, or `200` with the full result once the task has completed and cached the payload in Redis.
         *     3. Cached results are served on repeat polls, so refreshing returns immediately.
         *
         *     **`body_tag` is required** for any request that submits a new gene list — it is the key used for polling and caching.
         */
        post: operations["integrations_community_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/integrations/connectivity/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * @description ## Connectivity
         *     Retrieve the connectivity scores of a gene set across all functional networks.
         */
        get: operations["integrations_connectivity_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/integrations/edges/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * @description ## Integration Edges
         *     Retrieve the edges across all functional networks corresponding to a gene pair.
         */
        get: operations["integrations_edges_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/integrations/relevant/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * @description ## Relevant Integrations
         *     Retrieve a list of network integrations with a relevance score for a provided gene set.
         */
        post: operations["integrations_relevant_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/netwas/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create a NetWAS or MAGE-WAS job
         * @description Submit a gene-level GWAS file as multipart/form-data. Choose v1 for NetWAS on GIANT networks or v3 for MAGE-WAS on MAGE networks. The default is v1.
         *
         *     A successful submission returns 201 with the saved job, including its UUID. Poll GET /api/netwas/{id}/ to track status and obtain the results_file URL when completed. The title and email fields are optional. Request examples show a filename for gwas_file; send the actual file bytes in that multipart field.
         */
        post: operations["netwas_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/netwas/{id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Retrieve a NetWAS (v1, GIANT) or MAGE-WAS (v3, MAGE) job by the UUID returned at submission. Poll status for progress; completed jobs provide results_file and log_file URLs. The mhc field is null for v1; p_value is null for v3. */
        get: operations["netwas_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/newsletter/subscribe/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * @description Subscribe email to newsletter.
         *
         *     Private endpoint - intentionally undocumented.
         *
         *     Expected POST data:
         *     {
         *         "email": "user@example.com"
         *     }
         */
        post: operations["newsletter_subscribe_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/seek/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return a pre-existing cached SEEK result, or an error message if no result is found. */
        get: operations["seek_list"];
        put?: never;
        /**
         * @description ## SEEK Create
         *     Creates a SEEK result using the provided input parameters in the request body.
         *     ### Request Body
         *     *This endpoint accepts a POST request with a JSON payload:*
         *
         *     - `body_tag`: A string representing the body tag.
         *     - `query_genes`: A list of dictionaries representing genes.
         *     - `term_list`: A list of term dictionaries containing 'label' and 'value' keys.
         *     - `query_organism`: A string representing the slug for the query organism.
         */
        post: operations["seek_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/seek/enrichment/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * @description ## SEEK Enrichment
         *     Retrieves gene enrichment data for the provided query genes.
         *     ### Request Body
         *     *This endpoint accepts a POST request with a JSON payload:*
         *
         *     - `body_tag`: A string representing the body tag.
         *     - `query_genes`: A list of dictionaries representing genes.
         *     - `term_list`: A list of term dictionaries containing 'label' and 'value' keys.
         *     - `query_organism`: A string representing the slug for the query organism.
         */
        post: operations["seek_enrichment_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/seek/expression/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * @description ## SEEK Expression
         *     Retrieves gene expression data for the provided query genes and datasets.
         *     ### Request Body
         *     *This endpoint accepts a POST request with a JSON payload:*
         *
         *     - `body_tag`: A string representing the body tag.
         *     - `datasets`: **_(optional)_** An optional list of strings representing dataset IDs.
         *     - `page`: **_(optional)_** The requested page number for pagination. Defaults to 1.
         *     - `page_y`: **_(optional)_** The requested page number for pagination on the Y-axis. Defaults to 1.
         *     - `reference_organism`: A string representing the slug for the reference organism.
         *     - `filter_entrez`: **_(optional)_** An optional list of integers representing the Entrez IDs to filter.
         *     - `query_genes`: A list of dictionaries representing genes.
         *     - `term_list`: A list of term dictionaries containing 'label' and 'value' keys.
         *     - `query_organism`: A string representing the slug for the query organism.
         */
        post: operations["seek_expression_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/terms/{slug}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Retrieve a term by slug */
        get: operations["terms_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/terms/{slug}/annotations/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Returns a list of genes annotated to the term */
        get: operations["terms_annotations_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/terms/{slug}/predictions/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Returns a list of gene predictions for the term */
        get: operations["terms_predictions_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/terms/annotated/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Returns a list of terms that a provided set of genes are annotated to. Term annotations are filtered to only include the input genes */
        get: operations["terms_annotated_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** @description Serialize an annotation -- a term and publication associated with a gene */
        Annotation: {
            readonly gene: components["schemas"]["Gene"];
            readonly term: components["schemas"]["Term"];
            readonly database: components["schemas"]["Database"];
            readonly pub: components["schemas"]["Publication"];
            evidence: string;
        };
        Compendium: {
            /** Format: uri */
            readonly url: string;
            /** @description Title of the data compendium */
            title: string;
            /** @description Slugified name of data compendium */
            slug: string;
            /** @description Description of the compendium */
            description: string;
        };
        ContextRequest: {
            /** @description Title of context */
            title: string;
        };
        CrossRef: {
            xrid: string;
            readonly crossrefdb: components["schemas"]["CrossRefDB"];
        };
        CrossRefDB: {
            name: string;
            /** Format: uri */
            url: string;
        };
        CrossRefDBRequest: {
            name: string;
            /** Format: uri */
            url: string;
        };
        CrossRefRequest: {
            xrid: string;
        };
        Database: {
            /** Format: uri */
            readonly url: string;
            name: string;
            /** @description Slugified database name */
            slug: string;
            term_version: string;
            annotation_version: string;
        };
        DatabaseRequest: {
            name: string;
            /** @description Slugified database name */
            slug: string;
            term_version: string;
            annotation_version: string;
        };
        Dataset: {
            /** Format: uri */
            readonly url: string;
            /** @description Dataset identifier */
            identifier: string;
            /** @description Dataset identifier with platform name */
            identifier_with_platform?: string;
            /** @description Dataset title */
            title: string;
            /** @description Dataset description */
            description: string;
            readonly etype: components["schemas"]["EdgeType"];
            publication: components["schemas"]["Publication"];
            annotations: components["schemas"]["DatasetAnnotation"][];
            metadata?: unknown;
        };
        DatasetAnnotation: {
            readonly annotation_source: string;
            readonly term_source: string;
            readonly name: string;
            readonly identifier: string;
        };
        DatasetIdOnly: {
            /** @description Dataset identifier */
            identifier: string;
        };
        DatasetTitle: {
            /** @description Dataset identifier */
            identifier: string;
            /** @description Dataset title */
            title: string;
        };
        DeepSEA: {
            /** Format: uri */
            readonly url: string;
            name: string;
            /** Format: int64 */
            sequence_length: number;
            genome: string;
            is_strand_specific?: boolean;
        };
        DeepSEAJobCreateRequest: {
            ds_model: string;
            /**
             * @description Input file type. Options are: vcf, fasta, bed
             *
             *     * `vcf` - vcf
             *     * `fasta` - fasta
             *     * `bed` - bed
             */
            input_type: components["schemas"]["InputTypeEnum"];
            /** @description Job title */
            title?: string;
            /**
             * Format: email
             * @description Email address for sending DeepSEA results
             */
            email?: string;
            /** @description Run user submitted ExPecto */
            expecto?: boolean;
            /** @description Run in silico mutagenesis on a sequence */
            insilico?: boolean;
            /**
             * @description Optional output file format. Currently this is only supported for in-silico mutagenesis and user submitted ExPecto submissions. Possible choices are: tsv, hdf5
             *
             *     * `tsv` - tsv
             *     * `hdf5` - hdf5
             */
            output_format?: components["schemas"]["OutputFormatEnum"];
            genome_assembly: string;
        };
        EdgeType: {
            /** @description Title of the data edge type */
            title: string;
            /** @description Slugified edge type title */
            slug: string;
            description: string;
        };
        EnrichmentRequestPostRequest: {
            body_tag: string;
            query_genes: components["schemas"]["GeneRequest"][];
            term_list: components["schemas"]["EnrichmentRequestPostTermRequest"][];
            query_organism: string;
        };
        EnrichmentRequestPostTermRequest: {
            label: string;
            value: string;
            datasets?: number;
        };
        ExpressionRequestPostRequest: {
            body_tag: string;
            datasets?: string[];
            /** @default 1 */
            page: number;
            /** @default 1 */
            page_y: number;
            reference_organism: string;
            filter_entrez?: number[];
            query_genes: components["schemas"]["GeneRequest"][];
            term_list: components["schemas"]["ExpressionRequestPostTermRequest"][];
            query_organism: string;
        };
        ExpressionRequestPostTermRequest: {
            label: string;
            value: string;
            datasets?: number;
        };
        /**
         * @description A ModelSerializer that takes an additional `fields` argument that
         *     controls which fields should be displayed.
         */
        Gene: {
            /** Format: uri */
            readonly url: string;
            /**
             * Format: int64
             * @description Unique NCBI Entrez ID
             */
            entrez: number;
            systematic_name: string;
            standard_name?: string | null;
            description: string;
            readonly xrefs: components["schemas"]["CrossRef"][];
            readonly aliases: string[];
        };
        /**
         * @description A single gene, plus which compendiums contain it.
         *
         *     Separate from GeneSerializer because that one also renders network nodes,
         *     variant genes and term annotations, which are list payloads that neither
         *     need availability nor should pay to compute it.
         *
         *     Always emits a list. `[]` means the gene is in the catalog but in no
         *     compendium; the field being absent would instead mean availability is
         *     unknown, and clients treat those differently.
         */
        GeneDetail: {
            /** Format: uri */
            readonly url: string;
            /**
             * Format: int64
             * @description Unique NCBI Entrez ID
             */
            entrez: number;
            systematic_name: string;
            standard_name?: string | null;
            description: string;
            readonly xrefs: components["schemas"]["CrossRef"][];
            readonly aliases: string[];
            readonly versions_available: string[];
        };
        /**
         * @description A ModelSerializer that takes an additional `fields` argument that
         *     controls which fields should be displayed.
         */
        GeneRequest: {
            /**
             * Format: int64
             * @description Unique NCBI Entrez ID
             */
            entrez: number;
            systematic_name: string;
            standard_name?: string | null;
            description: string;
        };
        /**
         * @description * `vcf` - vcf
         *     * `fasta` - fasta
         *     * `bed` - bed
         * @enum {string}
         */
        InputTypeEnum: "vcf" | "fasta" | "bed";
        IntegrationRequest: {
            /** @description Context slug of the integration */
            slug: string;
        };
        Job: {
            /**
             * Format: uuid
             * @description Unique NetWAS job identifier
             */
            id?: string;
            /** Format: date-time */
            readonly created: string;
            /** @description Optional job title */
            title?: string;
            /**
             * Format: email
             * @description Optional email address for sending NetWAS results
             */
            email?: string;
            /** @description Job progress: queued (waiting for a worker), running (analysis in progress), completed (results_file is ready), or error: <reason> (analysis failed). Older jobs may show not_started (not yet queued). Poll the retrieve endpoint until completed or error: <reason>. */
            status?: string;
            /**
             * Format: uri
             * @description GWAS file of gene p-values
             */
            gwas_file: string;
            /** @description Format of the GWAS file */
            gwas_format?: string;
            /** @description Tissue network name (e.g. brain) */
            tissue: string;
            /**
             * Format: double
             * @description The v1 SVM training cutoff; null for v3 jobs.
             */
            p_value?: number | null;
            /**
             * Format: uri
             * @description NetWAS logging file
             */
            log_file?: string;
            /**
             * Format: uri
             * @description Location of the NetWAS results file
             */
            results_file?: string;
            /** @description v1 runs NetWAS on GIANT networks; v3 runs MAGE-WAS on MAGE networks. */
            version?: string;
            /**
             * @description MHC choice for v3 jobs: exclude or keep; null for v1.
             *
             *     * `exclude` - exclude
             *     * `keep` - keep
             */
            readonly mhc: (components["schemas"]["MhcEnum"] | components["schemas"]["NullEnum"]) | null;
        };
        /**
         * @description A ModelSerializer that takes an additional `fields` argument that
         *     controls which fields should be displayed.
         */
        MeshHeading: {
            readonly descriptor: string;
            readonly qualifier: string;
        };
        /**
         * @description * `exclude` - exclude
         *     * `keep` - keep
         * @enum {string}
         */
        MhcEnum: "exclude" | "keep";
        /** @enum {unknown} */
        NullEnum: null;
        /**
         * @description * `tsv` - tsv
         *     * `hdf5` - hdf5
         * @enum {string}
         */
        OutputFormatEnum: "tsv" | "hdf5";
        /**
         * @description A ModelSerializer that takes an additional `fields` argument that
         *     controls which fields should be displayed.
         */
        Prediction: {
            /** Format: double */
            score: number;
            readonly term: components["schemas"]["Term"];
            readonly gene: components["schemas"]["Gene"];
            readonly version: components["schemas"]["Version"];
        };
        /**
         * @description A ModelSerializer that takes an additional `fields` argument that
         *     controls which fields should be displayed.
         */
        Publication: {
            pmid?: number | null;
            title: string;
            authors: string;
            /** Format: date */
            date: string;
            journal: string;
            mesh_headings: components["schemas"]["MeshHeading"][];
        };
        SeekPOSTRequestRequest: {
            /** Format: uuid */
            body_tag: string;
            query_genes: components["schemas"]["GeneRequest"][];
            term_list: components["schemas"]["TermRequest"][];
            query_organism: string;
        };
        Slim: {
            title: string;
            description: string;
            identifier: string;
        };
        SlimRequest: {
            title: string;
            description: string;
            identifier: string;
        };
        /** @description Default term object serialization */
        Term: {
            /** Format: uri */
            readonly url: string;
            title: string;
            description: string;
            readonly database: components["schemas"]["Database"];
            readonly slim_terms: components["schemas"]["Slim"][];
            identifier: string;
            readonly annotation_count: number;
        };
        /**
         * @description Serialize a term object with genes annotated to the term in the
         *     'annotations' list
         */
        TermAnnotation: {
            /** Format: uri */
            readonly url: string;
            title: string;
            description: string;
            readonly database: components["schemas"]["Database"];
            readonly slim_terms: components["schemas"]["Slim"][];
            identifier: string;
            readonly total_term_annotations: number;
            readonly annotations: number;
        };
        /** @description Default term object serialization */
        TermRequest: {
            title: string;
            description: string;
            identifier: string;
        };
        Version: {
            identifier: string;
        };
        /** @description Serializer for Integration Version (v1, v2, etc.) */
        VersionRequest: {
            /** @description Version identifier (eg. 1, 2 ...) */
            identifier: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    compendiums_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Compendium"][];
                };
            };
        };
    };
    compendiums_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The slug of the compendium to retrieve. */
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Compendium"];
                };
            };
        };
    };
    compendiums_data_list: {
        parameters: {
            query: {
                /** @description Entrez ID of the source gene */
                source: string;
                /** @description Entrez ID of the target gene */
                target: string;
            };
            header?: never;
            path: {
                /** @description The slug of the compendium to retrieve. */
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Dataset"][];
                };
            };
            /** @description Gene(s) not found or invalid parameters */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    compendiums_datasets_list: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The slug of the compendium to retrieve. */
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DatasetTitle"][];
                };
            };
        };
    };
    compendiums_search_list: {
        parameters: {
            query: {
                /** @description The search query. Can be a title, description, or slug. */
                q: string;
            };
            header?: never;
            path: {
                /** @description The slug of the compendium to retrieve. */
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DatasetIdOnly"][];
                };
            };
        };
    };
    compendiums_terms_retrieve: {
        parameters: {
            query?: {
                /** @description The minimum number of datasets for a term to be included in the result. For example, "10". */
                dataset_min?: number;
            };
            header?: never;
            path: {
                /** @description The slug of the compendium to retrieve. */
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    databases_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Database"][];
                };
            };
        };
    };
    databases_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The slug of the database to retrieve. */
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Database"];
                };
            };
        };
    };
    datasets_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The slug of the dataset to retrieve. */
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Dataset"];
                };
            };
        };
    };
    datatypes_list: {
        parameters: {
            query: {
                /** @description Version identifier (1 for GIANT, 3 for MAGE) */
                version: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EdgeType"][];
                };
            };
        };
    };
    datatypes_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The slug of the datatype to retrieve. */
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EdgeType"];
                };
            };
        };
    };
    deepsea_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Returns a list of DeepSEA models */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    deepsea_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The name of the DeepSEA model to retrieve. */
                name: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Returns details of the chosen DeepSEA model */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Returns error message if the model is not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    deepsea_feature_predictions_retrieve: {
        parameters: {
            query?: {
                /** @description String representation of chromosome and range of start and ending variant indices (e.g. "1:109700000:109800000"). */
                chr_and_variant_range?: string;
                /** @description String representation of specific chromosome & variant position, may be specified multiple times (e.g. "1:109705399"). */
                chr_variant?: string;
                /** @description Specify variant cutoff. */
                variant_cutoff?: string;
            };
            header?: never;
            path: {
                /** @description The name of the DeepSEA model to retrieve. */
                name: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    deepsea_features_retrieve: {
        parameters: {
            query?: {
                /** @description Specify to include expecto features. */
                expecto?: string;
            };
            header?: never;
            path: {
                /** @description The name of the DeepSEA model to retrieve. */
                name: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DeepSEA"];
                };
            };
        };
    };
    deepsea_jobs_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeepSEAJobCreateRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["DeepSEAJobCreateRequest"];
                "multipart/form-data": components["schemas"]["DeepSEAJobCreateRequest"];
            };
        };
        responses: {
            /** @description A new DeepSEA job instance was created successfully. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Invalid request data. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Too many jobs in progress. Wait for some of your jobs to finish before submitting more. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    deepsea_jobs_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                job_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Returns the specified DeepSEA job. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description The job_id does not exist. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    deepsea_jobs_feature_predictions_retrieve: {
        parameters: {
            query: {
                /** @description Chromosome and range of start and ending variant indices (eg. e.g. "1:109700000:109800000"). */
                chr_and_variant_range?: string;
                /** @description Specific chromosome & variant position (e.g. "1:109705399") */
                chr_variant?: string;
                /** @description The preferred score type relating to the DeepSEA job */
                score_type: string;
            };
            header?: never;
            path: {
                job_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Returns a list of feature predictions for submitted variants of the job */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Job not compatible with the score type or invalid request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Job not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    deepsea_jobs_in_silico_mutagenesis_retrieve: {
        parameters: {
            query: {
                /** @description String name of the desired feature value */
                feature_name: string;
                /** @description If set, does not return position, ref, or alt columns. */
                feature_only?: boolean;
                /** @description String name of the submitted sequence. */
                sequence_name: string;
            };
            header?: never;
            path: {
                job_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Returns feature predictions from in silico mutagenesis job. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description `sequence_name` or `feature_name` is missing, or `feature_name` does not begin with a feature index within range. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Job not found, or the job has no such sequence. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    deepsea_jobs_queue_position_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                job_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /**
             * @description Returns the queue size and the position of the job in the queue.
             *
             *     `queue_size` is the total number of jobs queued.
             *
             *     `position` is the position of the job in the queue (1-indexed).
             */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Job not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    deepsea_jobs_score_types_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                job_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Returns a list of available score types for the specified DeepSEA job. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Job not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    deepsea_jobs_sequence_scores_retrieve: {
        parameters: {
            query: {
                /** @description The preferred score type relating to the DeepSEA job */
                score_type: string;
            };
            header?: never;
            path: {
                job_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Returns the name of the DeepSEA model, score type, and a list of sequence scores */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Invalid request for input type */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Job not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    deepsea_jobs_variant_scores_retrieve: {
        parameters: {
            query: {
                /** @description The preferred score type relating to the deepsea job. */
                score_type: string;
            };
            header?: never;
            path: {
                job_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Returns a list of variant scores for the specified DeepSEA job */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Score type is not compatible with the ds model */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Job not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    genes_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The entrez id of the gene to retrieve. */
                entrez: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GeneDetail"];
                };
            };
        };
    };
    genes_annotations_list: {
        parameters: {
            query?: {
                /** @description Database of terms used to filter predictions. */
                database?: string;
                /** @description Pass `true` to recover legacy cross-organism annotation counts and term-size filtering. Default: human-only. Only valid with `giant_version=v1` (GIANT). */
                extended_universe?: boolean;
                /** @description Filter terms that have more than `max_term_size` gene annotations (default 300). */
                max_term_size?: number;
            };
            header?: never;
            path: {
                /** @description The entrez id of the gene to retrieve. */
                entrez: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Annotation"][];
                };
            };
        };
    };
    genes_predictions_list: {
        parameters: {
            query?: {
                /** @description Database of terms to filter predictions. */
                database?: string;
                /** @description Minimum score of predictions to return. */
                score_cutoff?: number;
                /** @description Version identifier of predictions. */
                version?: string;
            };
            header?: never;
            path: {
                /** @description The entrez id of the gene to retrieve. */
                entrez: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Prediction"][];
                };
            };
        };
    };
    genes_tissue_variants_list: {
        parameters: {
            query: {
                /** @description Boolean for collapsing redundant tissues. WARNING: Setting this to False will return a very large response. */
                collapse: boolean;
                /** @description Database containing variant predictions. Use "expecto-tissues" for tissue-level ExPecto predictions or "clever-tissues" for ExPectoSC primary cell type-specific predictions. */
                database?: string;
            };
            header?: never;
            path: {
                /** @description The entrez id of the gene to retrieve. */
                entrez: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Term"][];
                };
            };
        };
    };
    integrations_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Returns a list of all network integrations. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    integrations_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Network integration slug. Note: ensure integration version matches GIANT version */
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Returns a specific network integration. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Network integration not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    integrations_evidence_retrieve: {
        parameters: {
            query: {
                /** @description Data types to filter datasets by */
                datatypes?: ("co-expression" | "functional-relationship" | "gsea-microrna-targets" | "gsea-perturbations" | "interaction" | "tf-binding")[];
                /** @description Version of GIANT to use. Defaults to v1. */
                giant_version?: "v1" | "v3";
                /** @description Maximum number of datasets to return (default: no limit) */
                limit?: number;
                /** @description Entrez gene ID of the source */
                source: string;
                /** @description Entrez gene ID of the target */
                target: string;
            };
            header?: never;
            path: {
                /** @description Network integration slug. Note: ensure integration version matches GIANT version */
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /**
             * @description Returns the list of datasets and theircontributions for a gene pair:
             *
             *     - `datatypes`: list of dataset type dicts
             *     - `datasets`: list of dataset dicts
             */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Invalid request parameters */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Integration or gene not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    integrations_network_retrieve: {
        parameters: {
            query: {
                /** @description The list of data types to be used in the integration */
                datatypes?: string;
                /** @description List of entrez gene IDs; maximum 30 genes. */
                entrez: string;
                /** @description Version of GIANT to use. Defaults to v1. */
                giant_version?: "v1" | "v3";
                /** @description Size of (additional genes) the subnetwork to return. */
                node_size?: number;
                /** @description Prior probability of a functional relationship. */
                prior?: number;
            };
            header?: never;
            path: {
                /** @description Network integration slug. Note: ensure integration version matches GIANT version */
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Returns the relevant gene subnetwork including genes, edges, and mincut. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Invalid request parameters */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Gene not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    integrations_community_create: {
        parameters: {
            query: {
                /** @description Required. Stable identifier used to key the in-flight task and the cached result in Redis. Clients must send the same value on the initial submission and every subsequent poll. */
                body_tag: string;
                /** @description Return / partition only the edges with comembership scores above the specified membership percentage (default 90 percent) */
                comembership?: number;
                /** @description When true, includes all organism annotations in the enrichment background population, matching the behavior of previous API versions. Default restricts the background to human-annotated genes for the hypergeometric test. */
                extended_universe?: boolean;
                /** @description Sets the minimum Q value for Benjamini-Hochberg p-value correction of multiple hypothesis test. */
                false_dscv_rate?: number;
                /** @description Version of GIANT to use. Defaults to v1. */
                giant_version?: "v1" | "v3";
                /** @description Integration used to make a new request. */
                integration: string;
                /** @description The number of partitions to predict (default 10) */
                iterations?: number;
                /** @description For each submitted gene, the maximum number of neighbours to count starting with top weighted (default 50) */
                neighbour_count?: number;
                /** @description Optional user generated title for the query. */
                title?: string;
                /** @description Filter for the top % of edges in sknn (default 5 percent) */
                top_sknn?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IntegrationRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["IntegrationRequest"];
                "multipart/form-data": components["schemas"]["IntegrationRequest"];
            };
        };
        responses: {
            /** @description Community detection result. Returned on polls after the Celery task has finished. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Task submitted or still running. Body is `{"status": "processing"}`. Poll the same endpoint with the same `body_tag` (empty body) until `200` is returned. */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Missing `body_tag`, invalid `giant_version`, unknown integration, gene list shorter than MIN_QUERY_SIZE, or polled a `body_tag` that has no cached result and no in-flight task. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    integrations_connectivity_retrieve: {
        parameters: {
            query: {
                /** @description List of entrez gene IDs; maximum 30 genes. */
                entrez: string;
                /** @description Version of GIANT to use. Defaults to v1. */
                giant_version?: "v1" | "v3";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Returns a list of connectivity scores of the gene set across all functional networks. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Invalid request parameters */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Gene not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    integrations_edges_retrieve: {
        parameters: {
            query: {
                /** @description Slug of the compendium to use (GIANT only) */
                compendium_slug?: string;
                /** @description Data types to filter datasets by */
                datatypes?: ("co-expression" | "functional-relationship" | "gsea-microrna-targets" | "gsea-perturbations" | "interaction" | "tf-binding")[];
                /** @description Prior probability for the network */
                prior?: number;
                /** @description Entrez gene ID of the source gene */
                source: string;
                /** @description Entrez gene ID of the target gene */
                target: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Returns the list of edges across all networks where `source` and `target` are incident nodes */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Invalid request parameters */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Gene not found in the specified compendium */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    integrations_relevant_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IntegrationRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["IntegrationRequest"];
                "multipart/form-data": components["schemas"]["IntegrationRequest"];
            };
        };
        responses: {
            /** @description Returns a list of network integrations with a relevance score for the provided gene set. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Invalid request parameters */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Gene not found. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    netwas_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "multipart/form-data": {
                    /**
                     * Format: binary
                     * @description Gene-level GWAS file. Three formats are auto-detected:
                     *
                     *     **VEGAS / VEGAS2** (8 or more whitespace-separated columns): `Chr Gene nSNPs nSims Start Stop TestStat Pvalue [...]` - gene identifier in column 2, p-value in column 8.
                     *
                     *     **MAGMA .genes.out** (9 columns): `GENE CHR START STOP NSNPS NPARAM N ZSTAT P` - gene identifier in column 1, p-value in column 9.
                     *
                     *     **Plain 2-column**: `GENE<TAB>P_VALUE` - gene identifier in column 1, p-value in column 2.
                     *
                     *     For VEGAS and MAGMA, only the gene and p-value columns are used; the remaining columns are read but ignored.
                     *
                     *     A header row is optional in all formats and is auto-detected. Lines beginning with `#` are skipped (MAGMA-style comments). Gene identifiers may be HGNC standard symbols or Entrez IDs. File must be < 3 MB with a .txt / .csv / .tsv / .out extension.
                     *
                     *     v1 example files (the same BMI GWAS in each format): [VEGAS](https://s3-us-west-2.amazonaws.com/humanbase/netwas/examples/bmi-vegas.txt), [MAGMA](https://s3-us-west-2.amazonaws.com/humanbase/netwas/examples/bmi-magma.genes.out), [2-column](https://s3-us-west-2.amazonaws.com/humanbase/netwas/examples/bmi-2column.tsv).
                     *
                     *     v3 example files (MAGE-WAS Alzheimer's demonstration subset, 1,008 genes; for trying v3, not for results): [VEGAS](https://s3-us-west-2.amazonaws.com/humanbase/netwas/examples/alzheimer-vegas.txt), [MAGMA](https://s3-us-west-2.amazonaws.com/humanbase/netwas/examples/alzheimer-magma.genes.out), [2-column](https://s3-us-west-2.amazonaws.com/humanbase/netwas/examples/alzheimer-2column.tsv).
                     *
                     *     Collected defects are returned together in the gwas_file error list.
                     */
                    gwas_file: string;
                    /**
                     * @description The tissue network: an Integration slug for the chosen version, as listed by /api/integrations/ (for example brain for v1, brain-v3 for v3).
                     * @example brain
                     */
                    tissue: string;
                    /**
                     * @description Required for v1: p-value cutoff for SVM training. Genes below the cutoff are positives; genes at or above it are negatives. Ignored for v3, which uses the uploaded gene p-values directly and stores this field as null.
                     * @example 0.01
                     */
                    p_value?: number;
                    /**
                     * @description Used by v3 only; ignored for v1 (stored as null). Whether MAGE-WAS trains on the chr6 MHC region. Its long-range linkage makes one signal light up a whole block, so exclude is the default. Use keep for autoimmune traits, where the region carries the real signal.
                     * @default exclude
                     * @enum {string}
                     */
                    mhc?: "exclude" | "keep";
                    /**
                     * Format: email
                     * @description Optional email for job results.
                     */
                    email?: string;
                    /**
                     * @description Optional title for the job.
                     * @example Example NetWAS job
                     */
                    title?: string;
                    /**
                     * @description Network version: v1 runs NetWAS on GIANT networks; v3 runs MAGE-WAS on MAGE networks.
                     * @default v1
                     * @enum {string}
                     */
                    version?: "v1" | "v3";
                };
            };
        };
        responses: {
            /** @description Job successfully created. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Job"];
                };
            };
            /** @description Invalid input. Field names map to lists of error messages, including tissue, p_value, and mhc. Upload errors use a gwas_file list containing all collected defects, or the first line of a rejection message. Upload errors for v1 also return stats (mapping counts against the p-value cutoff, or null); v3 has no cutoff, so its upload errors return only gwas_file. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        gwas_file?: string[];
                        stats?: {
                            [key: string]: unknown;
                        } | null;
                    } & {
                        [key: string]: string[];
                    };
                };
            };
            /** @description The submitting IP already has 5 queued or running jobs, across v1 and v3. Wait for a job to finish before submitting again. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        detail: string;
                    };
                };
            };
        };
    };
    netwas_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description NetWAS job retrieved successfully. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Job"];
                };
            };
            /** @description No job exists with this id. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        detail: string;
                    };
                };
            };
        };
    };
    newsletter_subscribe_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    seek_list: {
        parameters: {
            query: {
                /** @description The body tag parameter. */
                body_tag: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Returns SEEK results */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Returns error message */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    seek_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SeekPOSTRequestRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["SeekPOSTRequestRequest"];
                "multipart/form-data": components["schemas"]["SeekPOSTRequestRequest"];
            };
        };
        responses: {
            /** @description Returns SEEK results */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Returns error message */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    seek_enrichment_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EnrichmentRequestPostRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["EnrichmentRequestPostRequest"];
                "multipart/form-data": components["schemas"]["EnrichmentRequestPostRequest"];
            };
        };
        responses: {
            /** @description Returns SEEK enrichment results */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Returns error message */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    seek_expression_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExpressionRequestPostRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["ExpressionRequestPostRequest"];
                "multipart/form-data": components["schemas"]["ExpressionRequestPostRequest"];
            };
        };
        responses: {
            /** @description Returns SEEK expression results */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Returns error message */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    terms_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The slug of the term to retrieve. */
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Term"];
                };
            };
        };
    };
    terms_annotations_list: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The slug of the term to retrieve. */
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Annotation"][];
                };
            };
        };
    };
    terms_predictions_list: {
        parameters: {
            query?: {
                /** @description Version identifier of predictions. */
                version?: string;
            };
            header?: never;
            path: {
                /** @description The slug of the term to retrieve. */
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Prediction"][];
                };
            };
        };
    };
    terms_annotated_list: {
        parameters: {
            query: {
                /** @description Database name. */
                database: string;
                /** @description List of entrez gene IDs */
                entrez: string;
                /** @description Pass `true` to recover legacy cross-organism annotation counts and term-size filtering. Default: human-only. Only valid with `giant_version=v1` (GIANT). */
                extended_universe?: boolean;
                /** @description Cutoff for term size (default 300). */
                max_term_size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TermAnnotation"][];
                };
            };
        };
    };
}
