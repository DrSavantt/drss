import { getClient } from '@/app/actions/clients';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, FileText, Image as ImageIcon, File, Pencil } from 'lucide-react';
import { ClientCodeDisplay } from '../client-code-display';
import { ResetButton } from './reset-button';

interface IntakeResponse {
  version: string;
  completed_at: string;
  sections: {
    avatar_definition: Record<string, string | string[]>;
    dream_outcome: Record<string, string>;
    problems_obstacles: Record<string, string>;
    solution_methodology: Record<string, string>;
    brand_voice: Record<string, string | string[]>;
    proof_transformation: Record<string, string | string[]>;
    faith_integration: Record<string, string>;
    business_metrics: Record<string, string>;
  };
}

export default async function QuestionnaireResponsesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);

  if (!client) {
    notFound();
  }

  if (!client.intake_responses || client.questionnaire_status !== 'completed') {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            No Responses Available
          </h1>
          <p className="text-silver mb-6">
            This client hasn&apos;t completed the questionnaire yet.
          </p>
          <Link
            href={`/dashboard/clients/${client.id}`}
            className="text-red-primary hover:text-red-bright font-medium"
          >
            ← Back to Client Profile
          </Link>
        </div>
      </div>
    );
  }

  const responses = client.intake_responses as IntakeResponse;

  const sections = [
    {
      number: 1,
      title: 'Avatar Definition',
      data: responses.sections.avatar_definition,
      questions: [
        { key: 'q1_ideal_customer', label: 'Q1: Who is your IDEAL customer?' },
        { key: 'q2_avatar_criteria', label: 'Q2: Which criteria does your ideal customer meet?' },
        { key: 'q3_demographics', label: 'Q3: Demographics of your ideal customer' },
        { key: 'q4_psychographics', label: 'Q4: Psychographics of your ideal customer' },
        { key: 'q5_platforms', label: 'Q5: Where does your ideal customer spend time?' },
      ],
    },
    {
      number: 2,
      title: 'Dream Outcome & Value Equation',
      data: responses.sections.dream_outcome,
      questions: [
        { key: 'q6_dream_outcome', label: 'Q6: What is the dream outcome?' },
        { key: 'q7_status', label: 'Q7: What status does your customer achieve?' },
        { key: 'q8_time_to_result', label: 'Q8: How fast do they get results?' },
        { key: 'q9_effort_sacrifice', label: 'Q9: What effort/sacrifice is required?' },
        { key: 'q10_proof', label: 'Q10: What proof do you have?' },
      ],
    },
    {
      number: 3,
      title: 'Problems & Obstacles',
      data: responses.sections.problems_obstacles,
      questions: [
        { key: 'q11_external_problems', label: 'Q11: External problems' },
        { key: 'q12_internal_problems', label: 'Q12: Internal problems' },
        { key: 'q13_philosophical_problems', label: 'Q13: Philosophical problems (Optional)' },
        { key: 'q14_past_failures', label: 'Q14: Past failures' },
        { key: 'q15_limiting_beliefs', label: 'Q15: Limiting beliefs' },
      ],
    },
    {
      number: 4,
      title: 'Solution & Methodology',
      data: responses.sections.solution_methodology,
      questions: [
        { key: 'q16_core_offer', label: 'Q16: What is your core offer?' },
        { key: 'q17_unique_mechanism', label: 'Q17: What is your unique mechanism?' },
        { key: 'q18_differentiation', label: 'Q18: How are you different?' },
        { key: 'q19_delivery_vehicle', label: 'Q19: What is your delivery vehicle?' },
      ],
    },
    {
      number: 5,
      title: 'Brand Voice & Communication',
      data: responses.sections.brand_voice,
      questions: [
        { key: 'q20_voice_type', label: 'Q20: What is your brand voice type?' },
        { key: 'q21_personality_words', label: 'Q21: Personality words' },
        { key: 'q22_signature_phrases', label: 'Q22: Signature phrases' },
        { key: 'q23_avoid_topics', label: 'Q23: Topics to avoid' },
        { key: 'q33_brand_assets', label: 'Q33: Brand assets (Optional)' },
      ],
    },
    {
      number: 6,
      title: 'Proof & Transformation',
      data: responses.sections.proof_transformation,
      questions: [
        { key: 'q24_transformation_story', label: 'Q24: Transformation story' },
        { key: 'q25_measurable_results', label: 'Q25: Measurable results' },
        { key: 'q26_credentials', label: 'Q26: Credentials (Optional)' },
        { key: 'q27_guarantees', label: 'Q27: Guarantees' },
        { key: 'q34_proof_assets', label: 'Q34: Proof materials (Optional)' },
      ],
    },
    {
      number: 7,
      title: 'Faith Integration',
      data: responses.sections.faith_integration,
      questions: [
        { key: 'q28_faith_preference', label: 'Q28: Faith preference' },
        { key: 'q29_faith_mission', label: 'Q29: Faith mission (Conditional)' },
        { key: 'q30_biblical_principles', label: 'Q30: Biblical principles (Conditional)' },
      ],
    },
    {
      number: 8,
      title: 'Business Metrics',
      data: responses.sections.business_metrics,
      questions: [
        { key: 'q31_annual_revenue', label: 'Q31: Annual revenue' },
        { key: 'q32_primary_goal', label: 'Q32: Primary goal' },
      ],
    },
  ];

  const getFileIcon = (url: string) => {
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return <ImageIcon size={16} className="text-info" />;
    }
    if (url.match(/\.pdf$/i)) {
      return <FileText size={16} className="text-red-primary" />;
    }
    return <File size={16} className="text-silver" />;
  };

  const renderValue = (value: string | string[] | undefined) => {
    if (!value) return <span className="text-slate italic">Not answered</span>;

    // Check if it's a file URL array
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string' && value[0].startsWith('http')) {
      return (
        <div className="space-y-2">
          {value.map((url, idx) => {
            const fileName = url.split('/').pop() || `file-${idx + 1}`;
            return (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-red-primary hover:text-red-bright transition-colors bg-charcoal border border-mid-gray rounded-lg p-3"
              >
                {getFileIcon(url)}
                <span className="flex-1 truncate">{fileName}</span>
                <Download size={14} />
              </a>
            );
          })}
        </div>
      );
    }

    if (Array.isArray(value)) {
      return <span className="text-foreground">{value.join(', ')}</span>;
    }

    return <span className="text-foreground whitespace-pre-wrap">{value}</span>;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/dashboard/clients/${client.id}`}
            className="text-sm text-silver hover:text-red-primary transition-colors flex items-center gap-2 mb-4"
          >
            <ArrowLeft size={16} />
            Back to {client.name}
          </Link>
          <div className="flex items-center gap-3 mb-2">
            {client.client_code && (
              <ClientCodeDisplay 
                code={client.client_code} 
                className="bg-dark-gray px-2.5 py-1 rounded text-sm"
              />
            )}
            <h1 className="text-3xl font-bold text-foreground">
            Questionnaire Responses
          </h1>
          </div>
          <p className="text-silver">
            Completed on {new Date(responses.completed_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <ResetButton clientId={client.id} />
          <Link
            href={`/dashboard/clients/onboarding/${client.id}?mode=edit`}
            className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit Responses
          </Link>
        </div>
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <div
          key={section.number}
          className="bg-charcoal border border-mid-gray rounded-xl p-8 hover:border-red-bright/50 transition-all duration-200"
        >
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-bold text-red-primary bg-red-primary/10 px-3 py-1 rounded-full">
                Section {section.number}
              </span>
              <h2 className="text-2xl font-bold text-foreground">{section.title}</h2>
            </div>
          </div>

          <div className="space-y-6">
            {section.questions.map((question) => {
              const value = section.data[question.key];
              return (
                <div key={question.key} className="border-b border-mid-gray pb-6 last:border-0 last:pb-0">
                  <p className="text-sm font-semibold text-silver mb-3">
                    {question.label}
                  </p>
                  <div className="text-sm">
                    {renderValue(value as string | string[] | undefined)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
