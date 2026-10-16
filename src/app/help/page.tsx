import Link from "next/link";

const FAQ = [
  ["How are calories calculated?", "For foods recorded per 100 g (or 100 ml), VYORA uses: nutrient per 100 g × grams consumed ÷ 100. Household units like cups or pieces are only offered when the food has a specific conversion, because a cup of oats and a cup of rice weigh different amounts."],
  ["Is the AI Coach a real AI?", "Only if the server administrator has configured an AI provider. Otherwise the Coach runs in clearly labeled 'offline guide' mode with predefined guidance, and the workout/meal generators use transparent rules-based logic."],
  ["Are the exercise animations accurate?", "They are procedural SVG cartoons generated from keyframes to illustrate general movement patterns. They're not reviewed by a coach as definitive technique — always follow the written cues and listen to your body."],
  ["Where is my data stored?", "In your browser and in the app database, keyed to an anonymous device ID. You can export or delete it anytime in Settings."],
  ["Does VYORA give medical advice?", "No. VYORA provides general fitness and nutrition information. Consult a qualified professional for medical concerns, injuries, pregnancy, or specific dietary needs."],
];

export default function Help() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-accent">Support</p><h1 className="text-3xl font-extrabold tracking-tight">Help & privacy</h1></div>
      <section className="card p-5"><h2 className="mb-3 font-bold">Frequently asked questions</h2><div className="divide-y divide-line">{FAQ.map(([q, a]) => <details key={q} className="group py-3"><summary className="cursor-pointer list-none text-sm font-semibold marker:hidden group-open:text-accent">{q}</summary><p className="mt-2 text-sm text-muted">{a}</p></details>)}</div></section>
      <section id="privacy" className="card p-5 text-sm text-muted"><h2 className="mb-2 text-base font-bold text-fg">Privacy policy (summary)</h2><ul className="list-disc space-y-1.5 pl-5"><li>No account is required. Data is linked to a random device identifier.</li><li>Body measurements and health logs are optional and private; they are never shared publicly.</li><li>If AI is configured, chat messages (and an aggregate activity summary if you allow it) are sent to the AI provider to generate replies. API keys are kept on the server.</li><li>Barcode and online food searches are sent to Open Food Facts.</li><li>You can export or permanently delete your data from <Link href="/settings#data" className="text-accent">Settings</Link>.</li></ul></section>
      <section id="terms" className="card p-5 text-sm text-muted"><h2 className="mb-2 text-base font-bold text-fg">Terms of use (summary)</h2><p>VYORA is provided for general wellness and educational purposes. Exercise carries inherent risk; start gradually and stop if you feel pain, dizziness or discomfort. Nutrition values are approximate. VYORA doesn&apos;t diagnose, treat or prevent any condition.</p></section>
      <section className="card p-5 text-sm text-muted"><h2 className="mb-2 text-base font-bold text-fg">Safety first</h2><p>If you experience chest pain, fainting, severe shortness of breath or sudden severe pain, stop immediately and seek medical help. Contact local emergency services if symptoms are severe.</p></section>
    </div>
  );
}
