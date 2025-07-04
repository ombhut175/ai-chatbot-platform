// DATA SOURCE TYPES
export enum DataSourceType {
  PDF = 'pdf',
  CSV = 'csv',
  XLSX = 'xlsx',
  TXT = 'txt',
  DOCX = 'docx',
  JSON = 'json',
}

// DATA SOURCE STATUS
export enum DataSourceStatus {
  PROCESSING = 'processing',
  READY = 'ready',
  ERROR = 'error',
}