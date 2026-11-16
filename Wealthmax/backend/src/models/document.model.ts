import db from '../config/database';

export interface Document {
  id: number;
  client_id: string;
  advisor_id: string;
  filename: string;
  url: string;
  size: number;
  mime_type: string;
  uploaded_at: Date;
}

export class DocumentModel {
  static async getByClient(clientId: string, advisorId: string): Promise<Document[]> {
    const result = await db.query(
      'SELECT * FROM documents WHERE client_id = $1 AND advisor_id = $2 ORDER BY uploaded_at DESC',
      [clientId, advisorId]
    );
    return result.rows;
  }

  static async create(clientId: string, advisorId: string, filename: string, url: string, size: number, mimeType: string): Promise<Document> {
    const result = await db.query(
      `INSERT INTO documents (client_id, advisor_id, filename, url, size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [clientId, advisorId, filename, url, size, mimeType]
    );
    return result.rows[0];
  }
}
