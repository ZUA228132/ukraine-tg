export enum VerificationStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  PASSPORT_UPLOAD = 'PASSPORT_UPLOAD',
  VERIFYING = 'VERIFYING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export interface Submission {
  id: string;
  userName: string;
  imageData: string;
  passportImageData: string;
  timestamp: string;
}