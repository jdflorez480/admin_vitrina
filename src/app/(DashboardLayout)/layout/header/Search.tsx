'use client'
import { useState, useMemo } from 'react'
import { Icon } from '@iconify/react'
import SidebarContent, { MenuItem, ChildItem } from '../sidebar/sidebaritems'

import SimpleBar from 'simplebar-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

interface SearchResult {
  name: string
  url: string
  path: string | undefined
  icon?: string
}

function Search() {
  const [query, setQuery] = useState('')

  // 🔍 Recursive search through menu
  const searchItems = (
    items: (MenuItem | ChildItem)[],
    q: string,
    parentPath = ''
  ): SearchResult[] => {
    let results: SearchResult[] = []

    items.forEach((item) => {
      const currentPath = parentPath
        ? `${parentPath} → ${item.name}`
        : item.name

      // If match found
      if (item.name?.toLowerCase().includes(q.toLowerCase()) && item.url) {
        results.push({
          name: item.name,
          url: item.url,
          path: currentPath,
          icon: item.icon,
        })
      }

      // Search deeper children
      if (item.children) {
        results = [...results, ...searchItems(item.children, q, currentPath)]
      }
    })

    return results
  }

  // Memoize filtered results
  const results = useMemo(() => {
    if (!query.trim()) return []
    return searchItems(SidebarContent, query)
  }, [query])

  return (
    <div className='relative w-full'>
      <div className='flex items-center relative lg:w-xs mx-auto '>
        <Icon
          icon='solar:magnifer-linear'
          width='18'
          height='18'
          className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none'
        />

        <Input
          placeholder='Buscar en el panel…'
          aria-label='Buscar en el panel'
          className='rounded-full bg-muted/60 border-transparent pl-10 focus-visible:bg-card focus-visible:border-primary'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div
        className={`absolute w-full bg-card rounded-tw top-12 z-10 start-0 shadow-lg border border-border overflow-hidden ${
          Boolean(query) ? 'block' : 'hidden'
        }`}>
        <SimpleBar className='max-h-72 p-2 custom-scroll'>
          {Boolean(results.length) ? (
            results.map((item, i) => (
              <Link
                key={i}
                href={item.url}
                onClick={() => setQuery('')}
                className='group/link p-2.5 mb-1 last:mb-0 flex items-center gap-2 text-sm font-medium rounded-md hover:bg-lightprimary hover:text-primary w-full'>
                <div className='flex items-center'>
                  <Icon
                    icon={item.icon || 'iconoir:component'}
                    width={18}
                    height={18}
                    className='text-muted-foreground group-hover/link:text-primary'
                  />
                  <div className='ps-3'>
                    <h5 className='mb-0.5 text-sm group-hover/link:text-primary'>
                      {item.name}
                    </h5>
                    <span className='text-xs block truncate text-muted-foreground'>
                      {item.path}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className='flex flex-col items-center justify-center gap-1 px-4 py-8 text-center'>
              <Icon
                icon='solar:magnifer-linear'
                width={22}
                height={22}
                className='text-muted-foreground'
              />
              <p className='text-sm font-medium'>Sin resultados</p>
              <p className='text-xs text-muted-foreground'>
                Prueba con «usuarios» o «métricas».
              </p>
            </div>
          )}
        </SimpleBar>
      </div>
    </div>
  )
}

export default Search
