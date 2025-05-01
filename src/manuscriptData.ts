import axios from 'axios';

const bioxriv = async (versionedDoi: string) => axios.get<{
  results?: {
    filedate: string,
    tdm_path: string,
  }[],
}>(`https://api.biorxiv.org/meca_index_v2/${versionedDoi}`)
  .then((response) => response.data.results ?? [])
  .then((results) => results.map(({ tdm_path: content, filedate: date }) => ({
    content,
    date: new Date(date),
  })));

const hypothesis = async (id: string) => axios.get<{
  created: string,
  uri: string,
}>(`https://api.hypothes.is/api/annotations/${id}`)
  .then((response) => ({
    preprint: response.data.uri.split('/').slice(-2).join('/'),
    date: new Date(response.data.created),
    error: null,
  }))
  .catch((error) => {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return {
        preprint: null,
        date: null,
        error: `Resource with ID ${id} not found.`,
      };
    }
    throw error;
  });

const formatDate = (date: Date) => date.toISOString();
const evaluationUrl = (id: string) => `https://sciety.org/evaluations/hypothesis:${id}/content`;

export type PrepareManuscriptData = {
  msid: string,
  overridePreprints?: string,
  dateReviewed: Date,
  dateCurated: Date,
  evaluationSummaryId: string,
  peerReviewId: string,
  authorResponseId?: string,
  doi?: string,
};

export type PrepareManuscriptDataHelper = {
  msid: string;
  versions: {
    biorxiv: number,
    reviewed: Date,
    report?: string,
    response?: string,
    evaluation?: string,
  }[];
};

export const prepareManuscript = async ({
  msid,
  versions,
}: PrepareManuscriptDataHelper, umbrellaDoi?: string) => {
  const hypothesisDefault = {
    preprint: null,
    date: null,
    error: null,
  };

  const versionsDecorated = await Promise.all(versions.map(async ({
    biorxiv: biorxivVersion, reviewed, evaluation, report, response,
  }, index) => {
    const [
      {
        preprint: evaluationSummaryPreprint,
        date: evaluationSummaryDate,
        error: evaluationSummaryError,
      },
      {
        preprint: peerReviewPreprint,
        date: peerReviewDate,
        error: peerReviewError,
      },
      {
        preprint: authorResponsePreprint,
        date: authorResponseDate,
        error: authorResponseError,
      },
    ] = await Promise.all([
      evaluation,
      report,
      response,
    ].map(async (evaluationId) => (evaluationId ? hypothesis(evaluationId) : hypothesisDefault)));

    const errors = [
      evaluationSummaryError,
      peerReviewError,
      authorResponseError,
    ].filter((e) => e !== null);

    const preprints = [
      evaluationSummaryPreprint,
      peerReviewPreprint,
      authorResponsePreprint,
    ].filter((e) => e !== null);

    if (preprints.length === 0) {
      errors.push('No preprint found from evaluations');
    }

    const [exampleDoi] = preprints;
    const [doi] = exampleDoi.split('v');
    const versionedDoi = `${doi}v${biorxivVersion}`;
    const [biorxivDetails] = await bioxriv(versionedDoi);

    if (biorxivDetails === undefined) {
      errors.push(`Could not retrieve biorxiv response for ${versionedDoi}`);
    }

    const createEvaluation = (reviewType: string, date: Date, participants: string[], contentUrl: string) => ({
      reviewType,
      date: formatDate(date),
      participants: participants.map((name) => ({
        name,
        role: 'curator',
      })),
      contentUrls: [
        contentUrl,
      ],
    });

    const versionIdentifier = (index + 1).toString();

    return {
      id: msid,
      publishedDate: reviewed,
      ...(umbrellaDoi ? { doi: `${umbrellaDoi}.${versionIdentifier}`, versionIdentifier } : {}),
      preprint: {
        id: doi,
        doi,
        publishedDate: formatDate(biorxivDetails.date),
        versionIdentifier: biorxivVersion.toString(),
        content: [biorxivDetails.content],
        url: `https://www.biorxiv.org/content/${versionedDoi}`,
      },
      license: 'http://creativecommons.org/licenses/by/4.0/',
      content: [biorxivDetails.content],
      peerReview: {
        reviews: (report && peerReviewDate) ? [createEvaluation('review-article', peerReviewDate, [], evaluationUrl(report))] : [],
        ...(response && authorResponseDate ? {
          authorResponse: createEvaluation('author-response', authorResponseDate, [], evaluationUrl(response)),
        } : {}),
        ...(evaluation && evaluationSummaryDate ? {
          evaluationSummary: createEvaluation('evaluation-summary', evaluationSummaryDate, [], evaluationUrl(evaluation)),
        } : {}),
      },
      ...(report && peerReviewDate ? { reviewedDate: formatDate(peerReviewDate) } : {}),
      ...(response && authorResponseDate ? { authorResponseDate: formatDate(authorResponseDate) } : {}),
      ...(errors.length > 0 ? { errors } : {}),
    };
  }));

  return versionsDecorated;
};
