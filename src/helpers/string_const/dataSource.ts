// DATA SOURCE TYPES
export enum DataSourceType {
  PDF = 'pdf',
  CSV = 'csv',
  XLSX = 'xlsx',
  DOCX = 'docx',
  JSON = 'json',
  TEXT = 'text',
  URL = 'url',
}

// DATA SOURCE STATUS
export enum DataSourceStatus {
  PROCESSING = 'processing',
  READY = 'ready',
  ERROR = 'error',
}