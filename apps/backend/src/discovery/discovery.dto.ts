export class CreateDiscoveryItemDto {
  perfumeId?: string;
  perfumeName?: string;
  perfumeBrand?: string;
  status: string; // 'ToTest' | 'Wishlist' | 'Archived'
  sillage?: number;
  longevity?: number;
  verdict?: string; // 'Heart' | 'Neutral' | 'Disappointment'
}

export class UpdateDiscoveryItemDto {
  perfumeId?: string;
  perfumeName?: string;
  perfumeBrand?: string;
  status?: string;
  sillage?: number;
  longevity?: number;
  verdict?: string;
}
