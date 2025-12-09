import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({
  region: process.env.APP_AWS_REGION || 'eu-north-1',
});

interface SecretData {
  MONGODB_URI?: string;
  DATABASE_NAME?: string;
  ADMIN_API_KEY?: string;
}

let cachedSecrets: SecretData | null = null;

export async function getSecrets(): Promise<SecretData> {
  if (cachedSecrets) {
    return cachedSecrets;
  }

  try {
    const command = new GetSecretValueCommand({
      SecretId: 'production/caf/shared',
    });

    const response = await client.send(command);

    if (response.SecretString) {
      cachedSecrets = JSON.parse(response.SecretString);
      return cachedSecrets || {};
    }

    return {};
  } catch (error) {
    console.error('Error fetching secrets from AWS Secrets Manager:', error);
    // Return empty object if secrets can't be fetched - will fall back to env vars
    return {};
  }
}

export async function getMongoDBUri(): Promise<string> {
  // Try environment variable first
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  // Fall back to AWS Secrets Manager
  const secrets = await getSecrets();
  return secrets.MONGODB_URI || 'mongodb://localhost:27017';
}

export async function getDatabaseName(): Promise<string> {
  // Try environment variable first
  if (process.env.DATABASE_NAME) {
    return process.env.DATABASE_NAME;
  }

  // Fall back to AWS Secrets Manager
  const secrets = await getSecrets();
  return secrets.DATABASE_NAME || 'cafapp';
}
