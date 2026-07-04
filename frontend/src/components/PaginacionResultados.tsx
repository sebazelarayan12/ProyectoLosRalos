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
      <PaginationContent className="w-full justify-between">
        <PaginationItem>
          <Button variant="outline" size="sm" disabled={!canGoPrev} onClick={onPrev}>
            Anterior
          </Button>
        </PaginationItem>
        <PaginationItem>
          <span className="text-xs text-muted-foreground">Navegacion por cursor</span>
        </PaginationItem>
        <PaginationItem>
          <Button variant="outline" size="sm" disabled={!canGoNext} onClick={onNext}>
            Siguiente
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
