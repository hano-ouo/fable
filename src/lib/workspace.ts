import { invoke } from '@tauri-apps/api/core'
import type { Work, WorkMeta } from '@/types/work'

export async function createWork(
  title: string,
  summary: string = '',
  tags: string[] = []
): Promise<WorkMeta> {
  return await invoke('create_work', { title, summary, tags })
}

export async function loadWorks(): Promise<WorkMeta[]> {
  return await invoke('list_works')
}

export async function loadWork(id: string): Promise<Work> {
  return await invoke('load_work', { id })
}

export async function saveWork(work: Work): Promise<void> {
  await invoke('save_work', { work })
}

export async function deleteWork(id: string): Promise<void> {
  await invoke('delete_work', { id })
}