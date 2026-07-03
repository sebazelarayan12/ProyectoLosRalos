import { Button } from '@/components/ui/button'
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination'

type PaginacionResultadosProps = {
  canGoPrev: boolean
  canGoNext: boolean
  onPrev: () => void
  onNext: () => void
}

export function PaginacionResultados({
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
}: PaginacionResultadosProps) {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <Button variant="outline" disabled={!canGoPrev} onClick={onPrev}>
            Anterior
          </Button>
        </PaginationItem>
        <PaginationItem>
          <Button variant="outline" disabled={!canGoNext} onClick={onNext}>
            Siguiente
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
