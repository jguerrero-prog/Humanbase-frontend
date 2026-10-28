import { dataVersionNames, type DataVersion } from '@humanbase/data';

/** The data version choices offered wherever a query picks MAGE or GIANT. */
export const versionOptions = (Object.keys(dataVersionNames) as DataVersion[]).map((version) => ({ value: version, label: dataVersionNames[version] }));
