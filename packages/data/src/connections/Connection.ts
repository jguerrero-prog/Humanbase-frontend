import { Integration, type IntegrationRecord } from '../networks/Integration';

export interface EvidenceRecord {
  datatypes: readonly { title: string; weight: number }[];
  datasets: readonly {
    identifier: string;
    title: string;
    etype: { title: string; slug: string };
    posterior: number;
  }[];
}

export type ConnectionNetworkRecord = IntegrationRecord & { posterior: number };

export interface DatasetEvidence {
  identifier: string;
  title: string;
  dataType: string;
  /** How much this dataset alone raises the chance of the connection. */
  contribution: number;
}

/** Why two genes connect in one network: the data types that support it and each dataset's contribution. */
export class ConnectionEvidence {
  constructor(private readonly record: EvidenceRecord) {}

  /** Data types that support the connection, strongest first. */
  get dataTypes(): string[] {
    return this.record.datatypes
      .filter((type) => type.weight > 0)
      .sort((a, b) => b.weight - a.weight)
      .map((type) => type.title);
  }

  /** Every dataset, strongest contribution first. */
  get datasets(): DatasetEvidence[] {
    return this.record.datasets
      .map((dataset) => ({ identifier: dataset.identifier, title: dataset.title, dataType: dataset.etype.title, contribution: dataset.posterior }))
      .sort((a, b) => b.contribution - a.contribution);
  }
}

/** The same gene pair in one of the other networks. */
export class ConnectionInNetwork {
  readonly network: Integration;

  constructor(private readonly record: ConnectionNetworkRecord) {
    this.network = new Integration(record);
  }

  get weight(): number {
    return this.record.posterior;
  }
}
