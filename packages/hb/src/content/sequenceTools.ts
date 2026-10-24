import { deepseaModels, inputKindNames, variantListInputs, type InputKind, type VariantModel } from '@humanbase/data';
import type { NavLink } from '@humanbase/ui';
import { deepseaFormLink } from '../Deepsea/DeepseaForm';
import { expressionEffectsLink, expressionTabs, geneExpressionTools, type ExpressionTab, type GeneExpressionTool } from '../Expecto/geneExpressionTools';
import { productTools } from './product';

/** One model on the Variants & sequences comparison, every line taken from its form's config. */
export interface SequenceToolModel {
  name: string;
  href: string;
  tool: NavLink;
  predicts: string;
  submit: readonly string[];
  scored: string;
}

const inputNames = (inputs: readonly InputKind[]) => inputs.map((input) => inputKindNames[input]);

function variantModel(model: VariantModel, tool: NavLink, inputs = deepseaModels[model].inputs): SequenceToolModel {
  const { tool: name, summary, scored = '' } = deepseaModels[model];
  return { name, href: deepseaFormLink(model), tool, predicts: summary, submit: inputNames(inputs), scored };
}

const searches: Record<Exclude<ExpressionTab, 'submit-variants'>, string> = { gene: 'a gene', rsid: 'an rsID' };

function expressionModel(model: GeneExpressionTool): SequenceToolModel {
  const { name, summary, scored, tabs } = geneExpressionTools[model];
  const submit = expressionTabs.filter((tab) => tabs.includes(tab.value)).flatMap((tab) => (tab.value === 'submit-variants' ? inputNames(deepseaModels.expecto.inputs) : [searches[tab.value]]));
  return { name, href: expressionEffectsLink({ model }), tool: productTools.expressionEffects, predicts: summary, submit, scored };
}

export const sequenceToolModels: readonly SequenceToolModel[] = [
  variantModel('sei', productTools.variantEffects, variantListInputs),
  variantModel('beluga', productTools.variantEffects, variantListInputs),
  // Region scan's form says what it scores in its Model hint, so it has no scored line of its own.
  { ...variantModel('insilico', productTools.variantEffects), scored: deepseaModels.insilico.otherModels },
  variantModel('seqweaver', productTools.seqweaver),
  expressionModel('expecto'),
  expressionModel('expecto-sc'),
];
