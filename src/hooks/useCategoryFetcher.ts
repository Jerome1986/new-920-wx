// /hooks/useCategoryFetcher.ts
import type { Data } from '@/utils/http.ts'
import type { CateItem } from '@/types/CateItem'

export function useCategoryFetcher(
  fetchCategory: (level: number, parentId?: string) => Promise<Data<CateItem[]>>,
) {
  const fetchLevel1 = () => fetchCategory(1)
  const fetchLevel2 = (parentId: string) => fetchCategory(2, parentId)
  const fetchLevel3 = (parentId: string) => fetchCategory(3, parentId)

  return {
    fetchLevel1,
    fetchLevel2,
    fetchLevel3,
  }
}
