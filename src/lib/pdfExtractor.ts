import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Member } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const extractTextFromPDF = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(' ');
    fullText += pageText + ' ';
  }
  return fullText.replace(/\s+/g, ' ').trim();
};

export const analyzeAudienciaText = (text: string, members: Member[]) => {
  const normalized = text;

  // Data (dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy)
  const datePattern = /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/;
  let dataStr = '';
  const dateMatch = normalized.match(datePattern);
  if (dateMatch) {
    dataStr = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
  }

  // Hora (hh:mm)
  const timePattern = /\b([01]\d|2[0-3]):([0-5]\d)\b/;
  let horaStr = '';
  const timeMatch = normalized.match(timePattern);
  if (timeMatch) {
    horaStr = timeMatch[1];
  }

  // Local (palavras-chave)
  let localStr = '';
  const localPatterns = [
    /(?:local|vara|fórum|forum|comarca|auditoria)[\s:]+([^\n,.;]+)/i,
    /(\d+ª\s*(?:vara|auditoria)[\w\s]*)/i,
  ];
  for (const p of localPatterns) {
    const match = normalized.match(p);
    if (match) {
      localStr = (match[1] || match[0]).trim().substring(0, 80);
      break;
    }
  }

  // Processo (CNJ)
  const processoPattern = /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/;
  let processoStr = '';
  const processoMatch = normalized.match(processoPattern);
  if (processoMatch) {
    processoStr = processoMatch[0];
  }

  // Policiais citados
  const foundIds: number[] = [];
  members.forEach(member => {
    if (normalized.includes(member.matricula)) {
      foundIds.push(member.id);
    } else {
      const escapedName = member.nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const nameRegex = new RegExp(`\\b${escapedName}\\b`, 'i');
      if (nameRegex.test(normalized)) {
        foundIds.push(member.id);
      }
    }
  });

  return {
    data: dataStr || undefined,
    hora: horaStr || undefined,
    local: localStr || undefined,
    processo: processoStr || undefined,
    policialMatches: [...new Set(foundIds)],
  };
};
