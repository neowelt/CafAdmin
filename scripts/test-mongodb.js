const { MongoClient } = require('mongodb');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

async function getSecretsFromAWS() {
  const client = new SecretsManagerClient({
    region: 'eu-north-1',
  });

  try {
    const command = new GetSecretValueCommand({
      SecretId: 'production/caf/shared',
    });

    const response = await client.send(command);
    return JSON.parse(response.SecretString);
  } catch (error) {
    console.error('Error fetching secrets:', error.message);
    return null;
  }
}

async function testConnection() {
  console.log('Fetching MongoDB connection from AWS Secrets Manager...');

  const secrets = await getSecretsFromAWS();

  if (!secrets || !secrets.MONGODB_URI) {
    console.error('Could not fetch MongoDB URI from AWS Secrets Manager');
    console.log('Make sure you have AWS credentials configured (aws configure)');
    return;
  }

  console.log('Connecting to MongoDB...');

  const client = new MongoClient(secrets.MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB successfully!');

    const db = client.db(secrets.DATABASE_NAME || 'cafapp');
    const designs = await db.collection('templates').find({}).limit(5).toArray();

    console.log(`\nFound ${designs.length} designs in the database:`);
    designs.forEach((design, index) => {
      console.log(`${index + 1}. ${design.templateName} (${design.published ? 'Published' : 'Unpublished'})`);
    });

    console.log('\n✅ MongoDB connection test successful!');
    console.log('\nUpdate your .env.local with:');
    console.log(`MONGODB_URI=${secrets.MONGODB_URI}`);
    console.log(`DATABASE_NAME=${secrets.DATABASE_NAME || 'cafapp'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

testConnection();
