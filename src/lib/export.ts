import { Document, Packer, Paragraph, TextRun } from 'docx'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { writeFile } from '@tauri-apps/plugin-fs'
import type { Work } from '@/types/work'
import type { ExportSettings } from '@/types/export'

/* =========================
   DOCX
========================= */

export async function exportToDocx(
  work: Work,
  filePath: string
) {
  const paragraphs = work.content.split('\n\n')

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: work.meta.title,
                bold: true,
                size: 36,
              }),
            ],
          }),
          ...paragraphs.map(p =>
            new Paragraph({
              children: [new TextRun(p)],
            })
          ),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const buffer = await blob.arrayBuffer()

  console.log('WRITING TO:', filePath)

  await writeFile(filePath, new Uint8Array(buffer))

  console.log('WRITE SUCCESS')
}

/* =========================
   TXT
========================= */

export async function exportToTxt(
  work: Work,
  filePath: string
) {
  const content = [
    work.meta.title,
    '',
    work.meta.summary,
    '',
    work.content,
  ].join('\n')

  console.log('WRITING TO:', filePath)

  await writeFile(
    filePath,
    new TextEncoder().encode(content)
  )

  console.log('WRITE SUCCESS')
}

/* =========================
   创建离屏导出容器
========================= */

function createExportContainer(
  work: Work,
  width: number,
  settings: ExportSettings,
  pageInfo?: { current: number; total: number }
): HTMLElement {
  const container = document.createElement('div')

  container.style.position = 'fixed'
  container.style.left = '-99999px'
  container.style.top = '0'
  container.style.width = `${width}px`
  container.style.background = '#ffffff'
  container.style.color = '#111827'
  container.style.padding = '48px 64px'
  container.style.boxSizing = 'border-box'
  container.style.fontFamily =
    'Inter, Noto Sans SC, Segoe UI, sans-serif'
  container.style.lineHeight = '2'
  container.style.fontSize = '18px'

  // ===== 顶部区域 =====
  const header = document.createElement('div')
  header.style.display = 'flex'
  header.style.marginBottom = '28px'
  header.style.fontSize = '14px'
  header.style.color = '#6b7280'

  if (settings.header.position === 'left') {
    header.style.justifyContent = 'flex-start'
  } else if (settings.header.position === 'center') {
    header.style.justifyContent = 'center'
  } else {
    header.style.justifyContent = 'flex-end'
  }

  header.textContent = settings.header.text
  container.appendChild(header)

  // 标题
  const title = document.createElement('h1')
  title.textContent = work.meta.title
  title.style.fontSize = '36px'
  title.style.fontWeight = '700'
  title.style.margin = '0 0 16px 0'
  container.appendChild(title)

  // 简介
  if (work.meta.summary) {
    const summary = document.createElement('div')
    summary.textContent = work.meta.summary
    summary.style.color = '#6b7280'
    summary.style.fontStyle = 'italic'
    summary.style.marginBottom = '32px'
    container.appendChild(summary)
  }

  // 正文（保留真实空段）
  const paragraphs = work.content.split('\n\n')

  paragraphs.forEach(p => {
    const para = document.createElement('p')

    // 保留行内换行
    para.innerHTML = p.replace(/\n/g, '<br>')

    para.style.margin = '0 0 24px 0'
    para.style.textIndent = '2em'

    container.appendChild(para)
  })

  // ===== 底部区域 =====
  const footer = document.createElement('div')
  footer.style.display = 'flex'
  footer.style.marginTop = '40px'
  footer.style.paddingTop = '16px'
  footer.style.borderTop = '1px solid #e5e7eb'
  footer.style.fontSize = '13px'
  footer.style.color = '#6b7280'

  if (settings.footer.position === 'left') {
    footer.style.justifyContent = 'flex-start'
  } else if (settings.footer.position === 'center') {
    footer.style.justifyContent = 'center'
  } else {
    footer.style.justifyContent = 'flex-end'
  }

  const footerText = document.createElement('div')

  const parts: string[] = []

  if (settings.footer.text.trim()) {
    parts.push(settings.footer.text.trim())
  }

  if (pageInfo && settings.showPageNumber) {
    parts.push(`${pageInfo.current} / ${pageInfo.total}`)
  }

  if (settings.dateDisplay === 'created') {
    parts.push(
      new Date(work.meta.createdAt).toLocaleString('zh-CN')
    )
  } else if (settings.dateDisplay === 'updated') {
    parts.push(
      new Date(work.meta.updatedAt).toLocaleString('zh-CN')
    )
  }

  footerText.textContent = parts.join(' · ')
  footer.appendChild(footerText)
  container.appendChild(footer)

  document.body.appendChild(container)
  return container
}

function cleanupExportContainer(container: HTMLElement) {
  document.body.removeChild(container)
}

/* =========================
   长图导出
========================= */

export async function exportLongImage(
  work: Work,
  settings: ExportSettings,
  filePath: string
) {
  const width =
    settings.imageSize === 'mobile' ? 720 : 1280

  const container = createExportContainer(
    work,
    width,
    settings
  )

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    })

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => {
        if (b) resolve(b)
        else reject(new Error('canvas to blob failed'))
      }, 'image/png')
    })

    const buffer = await blob.arrayBuffer()

    console.log('WRITING TO:', filePath)

    await writeFile(filePath, new Uint8Array(buffer))

    console.log('WRITE SUCCESS')
  } finally {
    cleanupExportContainer(container)
  }
}

/* =========================
   分页长图导出
========================= */

export async function exportPagedImages(
  work: Work,
  settings: ExportSettings,
  firstPagePath: string
) {
  const width =
    settings.imageSize === 'mobile' ? 720 : 1280
  const pageHeight =
    settings.imageSize === 'mobile' ? 2400 : 3200

  const container = createExportContainer(
    work,
    width,
    settings
  )

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    })

    const totalPages = Math.ceil(canvas.height / pageHeight)

    for (let i = 0; i < totalPages; i++) {
      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = canvas.width
      pageCanvas.height = Math.min(
        pageHeight,
        canvas.height - i * pageHeight
      )

      const ctx = pageCanvas.getContext('2d')
      if (!ctx) continue

      ctx.drawImage(
        canvas,
        0,
        i * pageHeight,
        canvas.width,
        pageCanvas.height,
        0,
        0,
        canvas.width,
        pageCanvas.height
      )

      // 在裁切后的画布上绘制页码
      if (settings.showPageNumber) {
        ctx.fillStyle = '#6b7280'
        ctx.font = '28px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'

        ctx.fillText(
          `${i + 1} / ${totalPages}`,
          pageCanvas.width / 2,
          pageCanvas.height - 48
        )
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        pageCanvas.toBlob(b => {
          if (b) resolve(b)
          else reject(new Error('page canvas failed'))
        }, 'image/png')
      })

      const buffer = await blob.arrayBuffer()

      // 生成分页文件名
      const pagePath = firstPagePath.replace(
        /p\d+\.png$/i,
        `p${String(i + 1).padStart(2, '0')}.png`
      )

      console.log('WRITING TO:', pagePath)

      await writeFile(pagePath, new Uint8Array(buffer))
    }

    console.log('WRITE SUCCESS')
  } finally {
    cleanupExportContainer(container)
  }
}

/* =========================
   PDF
========================= */

export async function exportToPdf(
  work: Work,
  filePath: string
) {
  const settings: ExportSettings = {
    exportPath: filePath.substring(0, filePath.lastIndexOf('/')),
    fileType: 'pdf',
    imageMode: 'long',
    imageSize: 'pc',
    header: { text: work.meta.title, position: 'center' },
    footer: { text: '', position: 'right' },
    dateDisplay: 'none',
    showPageNumber: false,
  }

  const container = createExportContainer(work, 1280, settings)

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')

    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = 210
    const pageHeight = 297

    const imgWidth = pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(
      imgData,
      'PNG',
      0,
      position,
      imgWidth,
      imgHeight
    )

    heightLeft -= pageHeight

    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(
        imgData,
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight
      )
      heightLeft -= pageHeight
    }

    const pdfBytes = pdf.output('arraybuffer')

    console.log('WRITING TO:', filePath)

    await writeFile(filePath, new Uint8Array(pdfBytes))

    console.log('WRITE SUCCESS')
  } finally {
    cleanupExportContainer(container)
  }
}