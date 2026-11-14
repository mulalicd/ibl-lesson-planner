import { displayPlanText } from '@/lib/language/bosnianStandard';
import AppHeader from '@/components/AppHeader';
import ChatInterface from '@/components/ChatInterface';
import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan_id');
  const [initialPlan, setInitialPlan] = useState<{id: string, text: string} | null>(null);

  useEffect(() => {
    if (planId) {
      supabase
        .from('plans')
        .select('id, plan_text, subject, grade, topic, language')
        .eq('id', planId)
        .single()
        .then(({ data }) => {
          if (data) {
            setInitialPlan({ id: data.id, text: displayPlanText(data.plan_text, data.language) }); // P5-5
          }
        });
    }
  }, [planId]);
  return (
    <div className="flex flex-col h-screen bg-background gradient-mesh">
      <AppHeader />
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-4xl mx-auto">
          <ChatInterface initialPlan={initialPlan} />
        </div>
      </main>
    </div>
  );
}
