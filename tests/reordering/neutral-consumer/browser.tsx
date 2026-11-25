import "@tableweave/heroui/styles.css";
import { mountFixture, mountDirectFixture } from "./fixtures.js";
const columns = mountFixture(),
  rows = mountFixture(true, true),
  groups = mountFixture(false, false, true),
  arabic = mountFixture(false, false, false, true);
const direct = mountDirectFixture();
const api = {
  columns,
  rows,
  groups,
  arabic,
  direct,
  information() {
    return {
      order: columns.f.C.getSnapshot().columns.order,
      submissions: rows.f.submissions(),
      columnHelper: columns.f.helper,
      metadataReads: columns.f.metadataReads(),
      rows: rows.model()?.view?.rows.length,
    };
  },
  accept() {
    return columns.f.accept();
  },
};
Object.assign(window, { neutralConsumer: api });
export type BrowserAPI = typeof api;
