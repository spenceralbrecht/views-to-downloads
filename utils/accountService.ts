import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ConnectedAccount } from './tiktokService'

export class AccountService {
  private supabase = createClientComponentClient()

  /**
   * Get all connected accounts for a user
   */
  async getAllConnectedAccounts(userId: string): Promise<ConnectedAccount[]> {
    const { data, error } = await this.supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', userId)
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data || []
  }

  /**
   * Get connected accounts for a user by provider
   */
  async getConnectedAccountsByProvider(userId: string, provider: string): Promise<ConnectedAccount[]> {
    const { data, error } = await this.supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data || []
  }

  /**
   * Disconnect an account
   */
  async disconnectAccount(accountId: string): Promise<void> {
    await this.supabase
      .from('connected_accounts')
      .delete()
      .eq('id', accountId)
  }

  /**
   * Mock connection for demo purposes
   */
  async mockConnectAccount(
    userId: string,
    provider: string,
    username: string,
    displayName: string,
    profilePicture: string
  ): Promise<ConnectedAccount> {
    const mockAccount = {
      user_id: userId,
      provider,
      provider_account_id: `${provider}-${Math.random().toString(36).substring(2, 9)}`,
      username,
      display_name: displayName,
      profile_picture: profilePicture,
      created_at: new Date().toISOString(),
      metadata: {
        mock: true
      }
    }
    
    const { data, error } = await this.supabase
      .from('connected_accounts')
      .insert(mockAccount)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data
  }
}

// Export a singleton instance
export const accountService = new AccountService() 