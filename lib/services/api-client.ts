// API Client for external Lambda endpoints

const COLLECTIONS_API_BASE_URL = process.env.COLLECTIONS_API_BASE_URL || 'https://93cniuwf3h.execute-api.eu-north-1.amazonaws.com/production';
const ADMIN_API_BASE_URL = process.env.ADMIN_API_BASE_URL || 'https://frir8eg1ah.execute-api.eu-north-1.amazonaws.com/production';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

export class ExternalApiClient {
  /**
   * Fetch all designs from admin API
   * Endpoint: GET /admin/designs
   */
  static async fetchDesigns() {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/designs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch designs: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching designs from admin API:', error);
      throw error;
    }
  }

  /**
   * Fetch single design by ID from admin API
   * Endpoint: GET /admin/designs/{id}
   */
  static async fetchDesignById(id: string) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/designs/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch design: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching design from admin API:', error);
      throw error;
    }
  }

  /**
   * Fetch all collections from external API
   * Endpoint: GET /collections
   */
  static async fetchCollections(includeInactive = false) {
    try {
      const url = new URL(`${COLLECTIONS_API_BASE_URL}/collections`);
      if (includeInactive) {
        url.searchParams.append('includeInactive', 'true');
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch collections: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching collections from external API:', error);
      throw error;
    }
  }

  /**
   * Fetch collection with designs
   */
  static async fetchCollectionWithDesigns(slug: string) {
    try {
      const response = await fetch(`${COLLECTIONS_API_BASE_URL}/collections/${slug}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch collection: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching collection from external API:', error);
      throw error;
    }
  }

  /**
   * Fetch all orders from external API with pagination
   */
  static async fetchOrders(skip: number = 0, limit: number = 100) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/orders?skip=${skip}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching orders from external API:', error);
      throw error;
    }
  }

  /**
   * Complete an order
   */
  static async completeOrder(orderId: string) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/orders/admin/${orderId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to complete order: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error completing order:', error);
      throw error;
    }
  }

  /**
   * Create a new design via admin API
   */
  static async createDesign(designData: any) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/designs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
        body: JSON.stringify(designData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create design: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating design:', error);
      throw error;
    }
  }

  /**
   * Update a design via admin API
   */
  static async updateDesign(designId: string, designData: any) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/designs/${designId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
        body: JSON.stringify(designData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update design: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating design:', error);
      throw error;
    }
  }

  /**
   * Delete a design via admin API
   */
  static async deleteDesign(designId: string) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/designs/${designId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete design: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting design:', error);
      throw error;
    }
  }

  // ==================== Partner Methods ====================

  /**
   * Fetch all partners from admin API
   */
  static async fetchPartners() {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/partners`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch partners: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching partners from admin API:', error);
      throw error;
    }
  }

  /**
   * Fetch a partner by ID from admin API
   */
  static async fetchPartnerById(partnerId: string) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/partners/${partnerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch partner: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching partner from admin API:', error);
      throw error;
    }
  }

  /**
   * Create a new partner via admin API
   */
  static async createPartner(partnerData: any) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/partners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
        body: JSON.stringify(partnerData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create partner: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating partner:', error);
      throw error;
    }
  }

  /**
   * Update a partner via admin API
   */
  static async updatePartner(partnerId: string, partnerData: any) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/partners/${partnerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
        body: JSON.stringify(partnerData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update partner: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating partner:', error);
      throw error;
    }
  }

  /**
   * Delete a partner via admin API
   */
  static async deletePartner(partnerId: string) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/partners/${partnerId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete partner: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting partner:', error);
      throw error;
    }
  }

  // ==================== Prompt Template Methods ====================

  /**
   * Fetch all prompt templates from admin API
   */
  static async fetchPromptTemplates() {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/prompt-templates`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch prompt templates: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching prompt templates from admin API:', error);
      throw error;
    }
  }

  /**
   * Fetch a prompt template by ID from admin API
   */
  static async fetchPromptTemplateById(promptId: string) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/prompt-templates/${promptId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch prompt template: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching prompt template from admin API:', error);
      throw error;
    }
  }

  /**
   * Create a new prompt template via admin API
   */
  static async createPromptTemplate(templateData: any) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/prompt-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create prompt template: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating prompt template:', error);
      throw error;
    }
  }

  /**
   * Update a prompt template via admin API
   */
  static async updatePromptTemplate(promptId: string, templateData: any) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/prompt-templates/${promptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update prompt template: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating prompt template:', error);
      throw error;
    }
  }

  /**
   * Delete a prompt template via admin API
   */
  static async deletePromptTemplate(promptId: string) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/prompt-templates/${promptId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete prompt template: ${response.statusText}`);
      }

      return;
    } catch (error) {
      console.error('Error deleting prompt template:', error);
      throw error;
    }
  }

  /**
   * Test a prompt with S3 image keys
   */
  static async testPrompt(payload: { prompt: string; imageKeys: string[] }) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/prompt-templates/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to test prompt: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error testing prompt:', error);
      throw error;
    }
  }

  /**
   * Save example images for a prompt template
   */
  static async savePromptExample(promptId: string, formData: FormData) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/prompt-templates/${promptId}/save-example`, {
        method: 'PUT',
        headers: {
          'x-api-key': ADMIN_API_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to save prompt example: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving prompt example:', error);
      throw error;
    }
  }

  // ==================== Render Asset Methods ====================

  /**
   * Fetch all render assets from admin API
   */
  static async fetchRenderAssets() {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/render-assets`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch render assets: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching render assets from admin API:', error);
      throw error;
    }
  }

  /**
   * Fetch a render asset by key (PSD file path)
   */
  static async fetchRenderAssetByKey(key: string) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/render-assets/${encodeURIComponent(key)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch render asset: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching render asset from admin API:', error);
      throw error;
    }
  }

  /**
   * Create a new render asset via admin API
   */
  static async createRenderAsset(assetData: any) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/render-assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
        body: JSON.stringify(assetData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create render asset: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating render asset:', error);
      throw error;
    }
  }

  /**
   * Update a render asset via admin API (by key)
   */
  static async updateRenderAsset(key: string, assetData: any) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/render-assets/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
        body: JSON.stringify(assetData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update render asset: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating render asset:', error);
      throw error;
    }
  }

  /**
   * Upsert a render asset via admin API (create or update by key)
   */
  static async upsertRenderAsset(assetData: any) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/render-assets`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
        body: JSON.stringify(assetData),
      });

      if (!response.ok) {
        throw new Error(`Failed to upsert render asset: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error upserting render asset:', error);
      throw error;
    }
  }

  /**
   * Delete a render asset via admin API
   */
  static async deleteRenderAsset(key: string) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/admin/render-assets/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete render asset: ${response.statusText}`);
      }

      return;
    } catch (error) {
      console.error('Error deleting render asset:', error);
      throw error;
    }
  }
}
