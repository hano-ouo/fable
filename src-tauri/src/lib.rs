use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri_plugin_fs;

const WORKSPACE: &str = "G:/documentsave/FableWorkspace";
const WORKS_DIR: &str = "G:/documentsave/FableWorkspace/works";
const SETTINGS_PATH: &str = "G:/documentsave/FableWorkspace/settings.json";
const ANALYTICS_PATH: &str = "G:/documentsave/FableWorkspace/analytics.json";
const FOLDERS_PATH: &str = "G:/documentsave/FableWorkspace/folders.json";

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AppSettings {
    theme: String,
    editor_font_size: i32,
    indent_paragraph: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: "dark".to_string(),
            editor_font_size: 18,
            indent_paragraph: true,
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct WritingSession {
    date: String,
    words: i32,
    duration_ms: i64,
    work_id: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AnalyticsData {
    sessions: Vec<WritingSession>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct Folder {
    id: String,
    name: String,
    parent_id: Option<String>,
    order: i64,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct WorkMeta {
    id: String,
    title: String,
    summary: String,
    tags: Vec<String>,
    folder_id: Option<String>,
    created_at: String,
    updated_at: String,
    order: i64,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WorkData {
    meta: WorkMeta,
    inspiration: String,
    content: String,
}

#[tauri::command]
fn ensure_workspace() -> Result<(), String> {
    fs::create_dir_all(WORKS_DIR).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_works() -> Result<Vec<WorkMeta>, String> {
    ensure_workspace()?;

    let mut works = Vec::new();

    let entries = fs::read_dir(WORKS_DIR).map_err(|e| e.to_string())?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.is_dir() {
            let meta_path = path.join("meta.json");

            if meta_path.exists() {
                let text = fs::read_to_string(meta_path).map_err(|e| e.to_string())?;

                if let Ok(meta) = serde_json::from_str::<WorkMeta>(&text) {
                    works.push(meta);
                }
            }
        }
    }

    works.sort_by(|a, b| b.order.cmp(&a.order));

    Ok(works)
}

#[tauri::command]
fn create_work(
    title: String,
    summary: String,
    tags: Vec<String>,
) -> Result<WorkMeta, String> {
    ensure_workspace()?;

    let safe_title = title.trim();
    let timestamp = chrono::Utc::now().timestamp_millis();

    let id = format!("{}-{}", timestamp, safe_title.replace(' ', "-"));

    let dir = format!("{}/{}", WORKS_DIR, id);

    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let now = chrono::Utc::now().to_rfc3339();

    let meta = WorkMeta {
        id: id.clone(),
        title: safe_title.to_string(),
        summary,
        tags,
        folder_id: None,
        created_at: now.clone(),
        updated_at: now,
        order: timestamp,
    };

    let meta_text =
        serde_json::to_string_pretty(&meta).map_err(|e| e.to_string())?;

    fs::write(format!("{}/meta.json", dir), meta_text)
        .map_err(|e| e.to_string())?;

    fs::write(format!("{}/inspiration.md", dir), "")
        .map_err(|e| e.to_string())?;

    fs::write(format!("{}/content.md", dir), "")
        .map_err(|e| e.to_string())?;

    Ok(meta)
}

#[tauri::command]
fn load_work(id: String) -> Result<WorkData, String> {
    let base = format!("{}/{}", WORKS_DIR, id);

    let meta_text =
        fs::read_to_string(format!("{}/meta.json", base)).map_err(|e| e.to_string())?;

    let inspiration =
        fs::read_to_string(format!("{}/inspiration.md", base)).unwrap_or_default();

    let content =
        fs::read_to_string(format!("{}/content.md", base)).unwrap_or_default();

    let meta: WorkMeta =
        serde_json::from_str(&meta_text).map_err(|e| e.to_string())?;

    Ok(WorkData {
        meta,
        inspiration,
        content,
    })
}

#[tauri::command]
fn save_work(work: WorkData) -> Result<(), String> {
    let base = format!("{}/{}", WORKS_DIR, work.meta.id);

    // Update updated_at timestamp
    let now = chrono::Utc::now().to_rfc3339();
    let mut meta = work.meta;
    meta.updated_at = now;

    let meta_text = serde_json::to_string_pretty(&meta).map_err(|e| e.to_string())?;

    fs::write(format!("{}/meta.json", base), meta_text)
        .map_err(|e| e.to_string())?;

    fs::write(format!("{}/inspiration.md", base), work.inspiration)
        .map_err(|e| e.to_string())?;

    fs::write(format!("{}/content.md", base), work.content)
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn delete_work(id: String) -> Result<(), String> {
    let base = format!("{}/{}", WORKS_DIR, id);
    
    // 递归删除整个作品文件夹
    fs::remove_dir_all(&base).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_settings() -> Result<AppSettings, String> {
    ensure_workspace()?;

    let path = Path::new(SETTINGS_PATH);

    if !path.exists() {
        let default = AppSettings::default();
        let text = serde_json::to_string_pretty(&default).map_err(|e| e.to_string())?;
        fs::write(SETTINGS_PATH, text).map_err(|e| e.to_string())?;
        return Ok(default);
    }

    let text = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&text).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_settings(settings: AppSettings) -> Result<(), String> {
    ensure_workspace()?;

    let text = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(SETTINGS_PATH, text).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_analytics() -> Result<AnalyticsData, String> {
    ensure_workspace()?;

    let path = Path::new(ANALYTICS_PATH);

    if !path.exists() {
        return Ok(AnalyticsData {
            sessions: Vec::new(),
        });
    }

    let text = fs::read_to_string(path).map_err(|e| e.to_string())?;

    serde_json::from_str(&text).map_err(|e| e.to_string())
}

#[tauri::command]
fn append_writing_session(session: WritingSession) -> Result<(), String> {
    ensure_workspace()?;

    let mut data = load_analytics()?;

    data.sessions.push(session);

    let text =
        serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;

    fs::write(ANALYTICS_PATH, text).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_folders() -> Result<Vec<Folder>, String> {
    ensure_workspace()?;

    let path = Path::new(FOLDERS_PATH);

    if !path.exists() {
        fs::write(path, "[]").map_err(|e| e.to_string())?;
        return Ok(Vec::new());
    }

    let text = fs::read_to_string(path).map_err(|e| e.to_string())?;

    let mut folders: Vec<Folder> =
        serde_json::from_str(&text).map_err(|e| e.to_string())?;

    folders.sort_by(|a, b| a.order.cmp(&b.order));

    Ok(folders)
}

#[tauri::command]
fn create_folder(name: String, parent_id: Option<String>) -> Result<Folder, String> {
    let mut folders = list_folders()?;

    // 检查父文件夹是否存在
    if let Some(ref parent) = parent_id {
        if !folders.iter().any(|f| f.id == *parent) {
            return Err("父文件夹不存在".to_string());
        }
    }

    let folder = Folder {
        id: format!(
            "folder-{}",
            chrono::Utc::now().timestamp_millis()
        ),
        name: name.trim().to_string(),
        parent_id,
        order: chrono::Utc::now().timestamp_millis(),
    };

    folders.push(folder.clone());

    let text =
        serde_json::to_string_pretty(&folders).map_err(|e| e.to_string())?;

    fs::write(FOLDERS_PATH, text).map_err(|e| e.to_string())?;

    Ok(folder)
}

#[tauri::command]
fn rename_folder(id: String, name: String) -> Result<(), String> {
    let mut folders = list_folders()?;

    if let Some(folder) = folders.iter_mut().find(|f| f.id == id) {
        folder.name = name.trim().to_string();
    }

    let text =
        serde_json::to_string_pretty(&folders).map_err(|e| e.to_string())?;

    fs::write(FOLDERS_PATH, text).map_err(|e| e.to_string())
}

#[tauri::command]
fn move_folder(id: String, new_parent_id: Option<String>) -> Result<(), String> {
    let mut folders = list_folders()?;

    // 检查目标父文件夹是否存在
    if let Some(ref parent) = new_parent_id {
        if !folders.iter().any(|f| f.id == *parent) {
            return Err("目标父文件夹不存在".to_string());
        }
        // 不能移动到自己下面
        if *parent == id {
            return Err("不能将文件夹移动到自己下面".to_string());
        }
    }

    if let Some(folder) = folders.iter_mut().find(|f| f.id == id) {
        folder.parent_id = new_parent_id;
    }

    let text =
        serde_json::to_string_pretty(&folders).map_err(|e| e.to_string())?;

    fs::write(FOLDERS_PATH, text).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_folder(id: String) -> Result<(), String> {
    let mut folders = list_folders()?;

    // 递归获取所有子文件夹 ID
    fn get_all_sub_folder_ids(folders: &[Folder], parent_id: &str) -> Vec<String> {
        let mut ids = Vec::new();
        for f in folders {
            if f.parent_id.as_deref() == Some(parent_id) {
                ids.push(f.id.clone());
                ids.extend(get_all_sub_folder_ids(folders, &f.id));
            }
        }
        ids
    }

    let all_ids = get_all_sub_folder_ids(&folders, &id);
    let mut ids_to_delete = vec![id.clone()];
    ids_to_delete.extend(all_ids);

    // 删除这些文件夹
    folders.retain(|f| !ids_to_delete.contains(&f.id));

    let text =
        serde_json::to_string_pretty(&folders).map_err(|e| e.to_string())?;

    fs::write(FOLDERS_PATH, text).map_err(|e| e.to_string())?;

    // 将所有属于被删除文件夹的作品移到未分类
    let works = list_works()?;

    for meta in works {
        if let Some(folder_id) = &meta.folder_id {
            if ids_to_delete.contains(folder_id) {
                let base = format!("{}/{}", WORKS_DIR, meta.id);
                let meta_path = format!("{}/meta.json", base);

                let text =
                    fs::read_to_string(&meta_path).map_err(|e| e.to_string())?;

                let mut work_meta: WorkMeta =
                    serde_json::from_str(&text).map_err(|e| e.to_string())?;

                work_meta.folder_id = None;

                let new_text = serde_json::to_string_pretty(&work_meta)
                    .map_err(|e| e.to_string())?;

                fs::write(meta_path, new_text).map_err(|e| e.to_string())?;
            }
        }
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
	.plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            ensure_workspace,
            list_works,
            create_work,
            load_work,
            save_work,
            delete_work,
            load_settings,
            save_settings,
            load_analytics,
            append_writing_session,
            list_folders,
            create_folder,
            rename_folder,
            move_folder,
            delete_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}