import recorded from '../../samples/schema@format=json.json';
import { ApiReference } from './ApiReference';
import type { OpenApiDocument } from './OpenApi';

const reference = new ApiReference((recorded as { body: OpenApiDocument }).body);
const endpoint = (method: string, path: string) => {
  const found = reference.groups.flatMap((group) => group.endpoints).find((item) => item.method === method && item.path === path);
  if (!found) throw new Error(`${method} ${path} is not in the reference`);
  return found;
};

describe('ApiReference', () => {
  it('groups every GET and POST endpoint by its tag, leaving out the newsletter', () => {
    expect(reference.groups.map((group) => group.tag)).toEqual(['compendiums', 'databases', 'datasets', 'datatypes', 'deepsea', 'genes', 'integrations', 'netwas', 'seek', 'terms']);
    expect(reference.endpointCount).toBe(45);
    expect(reference.title).toBe('HumanBase API');
  });

  it('titles an endpoint with its summary, its ## heading, or its first sentence', () => {
    expect(endpoint('POST', '/api/netwas/').title).toBe('Create a NetWAS or MAGE-WAS job');
    const network = endpoint('GET', '/api/integrations/{slug}/network/');
    expect(network.title).toBe('Network');
    expect(network.description).toBe('Query a functional network and return the relevant gene subnetwork.');
    expect(endpoint('GET', '/api/genes/{entrez}/').title).toBe('Retrieve a gene by entrez id');
    expect(endpoint('GET', '/api/deepsea/jobs/{job_id}/').title).toBe('Returns the job specified by the job_id');
  });

  it('keeps headings inside a description under the endpoint’s own', () => {
    expect(endpoint('POST', '/api/seek/').description).toContain('#### Request Body');
  });

  it('describes parameters with their examples and choices', () => {
    const [entrez] = endpoint('GET', '/api/genes/{entrez}/').parameters;
    expect(entrez).toMatchObject({ name: 'entrez', location: 'path', required: true, type: 'string', examples: [{ label: 'Gene entrez id', value: '3553' }] });
    const version = endpoint('GET', '/api/integrations/{slug}/network/').parameters.find((parameter) => parameter.name === 'giant_version');
    expect(version?.choices).toEqual(['v1', 'v3']);
  });

  it('writes a response as its fields’ types', () => {
    const shape = JSON.parse(endpoint('GET', '/api/genes/{entrez}/').responses[0]?.shape ?? '{}') as Record<string, unknown>;
    expect(shape).toMatchObject({ entrez: 'integer', standard_name: 'string or null', aliases: ['string'] });
  });

  it('builds the request, address and curl command "Try it" sends', () => {
    const gene = endpoint('GET', '/api/genes/{entrez}/');
    const input = { values: gene.defaultValues };
    expect(gene.request(input)).toEqual({ method: 'GET', route: 'genes/3553/', query: {} });
    expect(gene.curl(input, 'https://humanbase.io/api')).toBe("curl -X GET 'https://humanbase.io/api/genes/3553/' \\\n  -H 'Accept: application/json'");
    const network = endpoint('GET', '/api/integrations/{slug}/network/');
    expect(network.url({ values: { slug: 'blood', entrez: '3553&entrez=7124' } }, '/api')).toBe('/api/integrations/blood/network/?entrez=3553&entrez=7124');
  });

  it('sends a JSON body as an object and a multipart body as a form', () => {
    const community = endpoint('POST', '/api/integrations/community/');
    expect(community.request({ values: {}, body: '{"entrez": [3553]}' }).body).toEqual({ entrez: [3553] });
    expect(community.problems({ values: {}, body: '{' })).toContain('The request body isn’t valid JSON.');
    const netwas = endpoint('POST', '/api/netwas/');
    expect(netwas.body?.fields.find((field) => field.file)?.name).toBe('gwas_file');
    expect(netwas.problems({ values: {}, form: {} })).toContain('Choose gwas_file.');
    expect(netwas.request({ values: {}, form: { version: 'v1' } }).body).toBeInstanceOf(FormData);
  });

  it('finds endpoints by every word typed, in their method, path, title or group', () => {
    expect(reference.filter('genes predictions').flatMap((group) => group.endpoints.map((item) => item.path))).toEqual(['/api/genes/{entrez}/predictions/']);
    expect(reference.filter('nothing like this')).toEqual([]);
  });
});
