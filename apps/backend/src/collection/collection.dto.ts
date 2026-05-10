export class CreateCollectionItemDto {
  perfumeId?: string; // Optional if brand/name provided
  perfumeName?: string;
  perfumeBrand?: string;
  format: string; // 'Flacon' | 'Decant' | 'Echantillon'
  level: number;  // 0-100
  openedAt: string; // ISO Date string
}

export class UpdateCollectionItemDto {
  format?: string;
  level?: number;
  openedAt?: string;
}
