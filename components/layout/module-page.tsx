type ModulePageProps = {
  title: string;
  description: string;
};

export function ModulePage({ title, description }: ModulePageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
