export interface Contact {
  id: string
  name: string
  email: string
  phone: string
  company: string
  status: 'Lead' | 'Active' | 'Inactive' | 'Churned'
  deal_value: number
  last_contacted: string
  created_at: string
}
