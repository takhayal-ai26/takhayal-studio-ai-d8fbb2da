import { TEMPLATE_PROMPTS, useApp } from '@/context/AppContext';

const templates = Object.entries(TEMPLATE_PROMPTS);

export function TemplatesView() {
  const { setPrompt, setSelectedTemplate, setActivePage } = useApp();

  const handleUse = (name: string, prompt: string) => {
    setPrompt(prompt);
    setSelectedTemplate(name);
    setActivePage('studio');
  };

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6 max-w-4xl">
      <h1 className="text-xl font-medium text-foreground mb-6">Templates</h1>
      <p className="text-sm text-muted-foreground mb-6">Ready-made prompts for common use cases</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {templates.map(([name, prompt]) => (
          <div key={name} className="bg-card border border-surface-border rounded-xl p-5 hover:border-muted-foreground/40 transition-colors">
            <h3 className="text-sm font-medium text-foreground mb-2">{name}</h3>
            <p className="text-[13px] text-muted-foreground line-clamp-2 mb-4">{prompt}</p>
            <button
              onClick={() => handleUse(name, prompt)}
              className="h-8 px-4 rounded-lg bg-primary/[0.12] text-primary text-[12px] font-medium hover:bg-primary/20 transition-colors"
            >
              Use template
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
