import dotenv from 'dotenv';
dotenv.config();

export const shapesApiKey = process.env.SHAPES_API_KEY;
export const shapesBaseUrl = process.env.SHAPES_BASE_URL || 'https://api.shapes.inc/v1';
export const shapesModel = process.env.SHAPES_MODEL 