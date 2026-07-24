import { invoke } from '@tauri-apps/api/core'
import type { Folder } from '@/types/folder'

export async function loadFolders(): Promise<Folder[]> {
  return await invoke('list_folders')
}

export async function createFolder(name: string, parentId?: string): Promise<Folder> {
  return await invoke('create_folder', { name, parentId: parentId ?? null })
}

export async function renameFolder(id: string, name: string): Promise<void> {
  await invoke('rename_folder', { id, name })
}

export async function moveFolder(id: string, newParentId: string | null): Promise<void> {
  await invoke('move_folder', { id, newParentId })
}

export async function deleteFolder(id: string): Promise<void> {
  await invoke('delete_folder', { id })
}