import db from '../config/database';

export interface InteractionLog {
  id: number;
  client_id: string;
  advisor_id: string;
  type: string;
  notes: string;
  created_at: Date;
}

export class InteractionLogModel {
  static async getByClient(clientId: string, advisorId: string): Promise<InteractionLog[]> {
    const result = await db.query(
      'SELECT * FROM interaction_logs WHERE client_id = $1 AND advisor_id = $2 ORDER BY created_at DESC',
      [clientId, advisorId]
    );
    return result.rows;
  }

  static async create(clientId: string, advisorId: string, type: string, notes: string): Promise<InteractionLog> {
    const result = await db.query(
      'INSERT INTO interaction_logs (client_id, advisor_id, type, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [clientId, advisorId, type, notes]
    );
    return result.rows[0];
  }
}
