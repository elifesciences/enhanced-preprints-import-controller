import { ManuscriptData } from '@elifesciences/docmap-ts';
import Joi from 'joi';
import { PrepareManuscriptDataHelper } from './manuscriptData';

const relatedContentItemSchema = Joi.object({
  type: Joi.string().required(),
  title: Joi.string().optional(),
  url: Joi.string().optional(),
  description: Joi.string().optional(),
  thumbnail: Joi.string().optional(),
});

const manuscriptSchema = Joi.object({
  doi: Joi.string().optional(),
  volume: Joi.string().optional(),
  eLocationId: Joi.string().optional(),
  publishedDate: Joi.date().iso().optional(),
  subjects: Joi.array().items(Joi.string()).optional(),
  relatedContent: Joi.array().items(relatedContentItemSchema).optional(),
});

const correctionSchema = Joi.object({
  content: Joi.array().items(Joi.string()).optional(),
  correctedDate: Joi.date().iso().required(),
});

const preprintSchema = Joi.object({
  id: Joi.string().required(),
  versionIdentifier: Joi.string().optional(),
  publishedDate: Joi.date().iso().optional(),
  doi: Joi.string().required(),
  url: Joi.string().optional(),
  content: Joi.array().items(Joi.string()).optional(),
  license: Joi.string().optional(),
  corrections: Joi.array().items(correctionSchema).optional(),
});

const versionedPreprintSchema = Joi.object({
  id: Joi.string().required(),
  versionIdentifier: Joi.string().required(),
  publishedDate: Joi.date().iso().optional(),
  doi: Joi.string().required(),
  url: Joi.string().optional(),
  content: Joi.array().items(Joi.string()).min(1).required(),
  license: Joi.string().optional(),
  corrections: Joi.array().items(correctionSchema).optional(),
});

const institutionSchema = Joi.object({
  name: Joi.string().required(),
  location: Joi.string().optional(),
});

const participantSchema = Joi.object({
  name: Joi.string().required(),
  role: Joi.string().required(),
  institution: institutionSchema.optional(),
});
const evaluationSchema = Joi.object({
  date: Joi.date().required(),
  doi: Joi.string().optional(),
  reviewType: Joi.string().valid('evaluation-summary', 'review-article', 'author-response').required(),
  contentUrls: Joi.array().items(Joi.string()).required(),
  participants: Joi.array().items(participantSchema).required(),
});

const peerReviewSchema = Joi.object({
  evaluationSummary: evaluationSchema.optional(),
  reviews: Joi.array().items(evaluationSchema).required(),
  authorResponse: evaluationSchema.optional(),
});

export const versionedReviewedPreprintSchema = Joi.object({
  id: Joi.string().required(),
  versionIdentifier: Joi.string().required(),
  doi: Joi.string().required(),
  preprint: preprintSchema.required(),
  publishedDate: Joi.date().iso().optional(),
  sentForReviewDate: Joi.date().iso().optional(),
  peerReview: peerReviewSchema.optional(),
  reviewedDate: Joi.date().iso().optional(),
  authorResponseDate: Joi.date().iso().optional(),
  license: Joi.string().optional(),
  corrections: Joi.array().items(correctionSchema).optional(),
  content: Joi.array().items(Joi.string()).optional(),
});

export const manuscriptDataSchema = Joi.object<ManuscriptData & { purge: boolean }>({
  id: Joi.string().required(),
  manuscript: manuscriptSchema.optional(),
  versions: Joi.array().items(versionedReviewedPreprintSchema, versionedPreprintSchema).min(1).required(),
  purge: Joi.boolean().invalid(false),
});

export const manuscriptDataHelperFormSchema = Joi.object<PrepareManuscriptDataHelper>({
  msid: Joi.string().trim().required(),
  versions: Joi.array().items(Joi.object({
    biorxiv: Joi.number().min(1).integer().required(),
    reviewed: Joi.string().trim().isoDate().optional()
      .empty(''),
    report: Joi.string().trim().optional().empty(''),
    response: Joi.string().trim().optional().empty(''),
    evaluation: Joi.string().trim().optional().empty(''),
    vor: Joi.boolean().optional(),
  }).or('report', 'response', 'evaluation')).min(1).required(),
});

export const importDocmapFormSchema = Joi.object<{ docmap: string }>({
  docmap: Joi.string().trim().required(),
});
