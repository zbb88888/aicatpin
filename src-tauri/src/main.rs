// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use chrono::Utc;

// ============================================================
// 数据结构定义
// ============================================================

/// 笔记数据结构
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub category: String,
    pub tags: Vec<String>,
    pub summary: String,
    pub content: String,
    pub created_at: String,
}

/// YAML Front-matter 结构
#[derive(Debug, Serialize, Deserialize)]
struct FrontMatter {
    title: String,
    category: String,
    tags: Vec<String>,
    summary: String,
    id: String,
    created_at: String,
    synced_at: String,
}

// ============================================================
// Tauri Commands
// ============================================================

/// 同步笔记到本地文件系统
/// 
/// 将笔记保存为带有 YAML Front-matter 的 Markdown 文件
/// 路径格式: ~/AICatPin_Vault/{category}/{title}.md
#[tauri::command]
fn sync_to_fs(note: Note) -> Result<String, String> {
    // 获取用户主目录
    let home_dir = dirs::home_dir()
        .ok_or_else(|| "无法获取用户主目录".to_string())?;
    
    // 构建基础目录路径
    let vault_dir = home_dir.join("AICatPin_Vault");
    
    // 构建分类目录路径
    let category_slug = slugify(&note.category);
    let category_dir = vault_dir.join(&category_slug);
    
    // 创建目录（如果不存在）
    fs::create_dir_all(&category_dir)
        .map_err(|e| format!("创建目录失败: {}", e))?;
    
    // 构建文件名
    let title_slug = slugify(&note.title);
    let filename = format!("{}.md", title_slug);
    let file_path = category_dir.join(&filename);
    
    // 生成 YAML Front-matter
    let front_matter = FrontMatter {
        title: note.title.clone(),
        category: note.category.clone(),
        tags: note.tags.clone(),
        summary: note.summary.clone(),
        id: note.id.clone(),
        created_at: note.created_at.clone(),
        synced_at: Utc::now().to_rfc3339(),
    };
    
    // 序列化 YAML
    let yaml_content = serde_yaml::to_string(&front_matter)
        .map_err(|e| format!("YAML 序列化失败: {}", e))?;
    
    // 构建完整的 Markdown 内容
    let markdown_content = format!(
        "---\n{}---\n\n# {}\n\n{}\n",
        yaml_content,
        note.title,
        note.content
    );
    
    // 写入文件
    fs::write(&file_path, markdown_content)
        .map_err(|e| format!("写入文件失败: {}", e))?;
    
    // 返回成功信息
    Ok(format!(
        "笔记已同步到: {}",
        file_path.display()
    ))
}

/// 获取 Vault 目录路径
#[tauri::command]
fn get_vault_path() -> Result<String, String> {
    let home_dir = dirs::home_dir()
        .ok_or_else(|| "无法获取用户主目录".to_string())?;
    
    let vault_dir = home_dir.join("AICatPin_Vault");
    
    Ok(vault_dir.to_string_lossy().to_string())
}

/// 列出 Vault 中的所有分类
#[tauri::command]
fn list_categories() -> Result<Vec<String>, String> {
    let home_dir = dirs::home_dir()
        .ok_or_else(|| "无法获取用户主目录".to_string())?;
    
    let vault_dir = home_dir.join("AICatPin_Vault");
    
    if !vault_dir.exists() {
        return Ok(Vec::new());
    }
    
    let mut categories = Vec::new();
    
    let entries = fs::read_dir(&vault_dir)
        .map_err(|e| format!("读取目录失败: {}", e))?;
    
    for entry in entries {
        let entry = entry.map_err(|e| format!("读取目录项失败: {}", e))?;
        let path = entry.path();
        
        if path.is_dir() {
            if let Some(name) = path.file_name() {
                categories.push(name.to_string_lossy().to_string());
            }
        }
    }
    
    Ok(categories)
}

/// 列出指定分类中的所有笔记
#[tauri::command]
fn list_notes(category: String) -> Result<Vec<String>, String> {
    let home_dir = dirs::home_dir()
        .ok_or_else(|| "无法获取用户主目录".to_string())?;
    
    let category_slug = slugify(&category);
    let category_dir = home_dir.join("AICatPin_Vault").join(&category_slug);
    
    if !category_dir.exists() {
        return Ok(Vec::new());
    }
    
    let mut notes = Vec::new();
    
    let entries = fs::read_dir(&category_dir)
        .map_err(|e| format!("读取目录失败: {}", e))?;
    
    for entry in entries {
        let entry = entry.map_err(|e| format!("读取目录项失败: {}", e))?;
        let path = entry.path();
        
        if path.is_file() {
            if let Some(name) = path.file_stem() {
                notes.push(name.to_string_lossy().to_string());
            }
        }
    }
    
    Ok(notes)
}

/// 检查 Ollama 服务是否可用
#[tauri::command]
async fn check_ollama_status() -> Result<bool, String> {
    let client = reqwest::Client::new();
    
    match client
        .get("http://127.0.0.1:11434/api/tags")
        .timeout(std::time::Duration::from_secs(5))
        .send()
        .await
    {
        Ok(response) => Ok(response.status().is_success()),
        Err(_) => Ok(false),
    }
}

// ============================================================
// 辅助函数
// ============================================================

/// 将字符串转换为 URL 友好的 slug
fn slugify(text: &str) -> String {
    // 使用 slug crate 或手动实现
    let slug = slug::slugify(text);
    
    // 如果 slug 为空，使用默认值
    if slug.is_empty() {
        "untitled".to_string()
    } else {
        slug
    }
}

// ============================================================
// 主函数
// ============================================================

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            sync_to_fs,
            get_vault_path,
            list_categories,
            list_notes,
            check_ollama_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}