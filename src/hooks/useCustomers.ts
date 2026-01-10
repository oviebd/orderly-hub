import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Customer } from '@/types';

export function useCustomers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const customersQuery = useQuery({
    queryKey: ['customers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(customer => ({
        id: customer.id,
        ownerId: customer.owner_id,
        phone: customer.phone,
        name: customer.name,
        rating: customer.rating,
        comment: customer.comment,
        createdAt: new Date(customer.created_at),
      })) as Customer[];
    },
    enabled: !!user,
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (customer: Omit<Customer, 'id' | 'createdAt' | 'ownerId'>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('customers')
        .insert({
          owner_id: user.id,
          phone: customer.phone,
          name: customer.name,
          rating: customer.rating,
          comment: customer.comment,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', user?.id] });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ customerId, updates }: { customerId: string; updates: Partial<Customer> }) => {
      const { data, error } = await supabase
        .from('customers')
        .update({
          name: updates.name,
          rating: updates.rating,
          comment: updates.comment,
        })
        .eq('id', customerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', user?.id] });
    },
  });

  const findCustomerByPhone = (phone: string) => {
    return customersQuery.data?.find(c => c.phone === phone);
  };

  return {
    customers: customersQuery.data ?? [],
    isLoading: customersQuery.isLoading,
    error: customersQuery.error,
    createCustomer: createCustomerMutation.mutateAsync,
    updateCustomer: updateCustomerMutation.mutateAsync,
    findCustomerByPhone,
    isCreating: createCustomerMutation.isPending,
    isUpdating: updateCustomerMutation.isPending,
  };
}
