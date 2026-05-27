// Shared TypeScript types for the Grid Intelligence Dashboard
// This file will be expanded in Task 2

export interface Outage {
  id: string
  title: string
  description?: string
  status?: string
  affectedCustomers?: number
  geometry?: {
    type: string
    coordinates: number[] | number[][] | number[][][]
  }
  startTime?: string
  estimatedRestoration?: string
}
