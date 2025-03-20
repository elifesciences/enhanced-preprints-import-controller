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

const gatherPreprints = (preprints: string[], dates: Date[], specificPreprints: string[]) => {
  // Use a Set to remove duplicates
  const uniquePreprints = Array.from(new Set(preprints));
  const uniqueSpecificPreprints = Array.from(new Set(specificPreprints));

  // Sort the preprints based on the numeric part
  uniquePreprints.sort((a, b) => {
    const matchA = a.match(/.+v([0-9]+)$/);
    const matchB = b.match(/.+v([0-9]+)$/);

    if (!matchA || !matchB) {
      throw new Error('Invalid preprint format');
    }

    const versionA = parseInt(matchA[1], 10);
    const versionB = parseInt(matchB[1], 10);

    return versionA - versionB;
  });

  uniqueSpecificPreprints.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  if (uniquePreprints.length < uniqueSpecificPreprints.length) {
    const [doi] = uniquePreprints[uniquePreprints.length - 1].split('v');
    for (let i = uniquePreprints.length; i < uniqueSpecificPreprints.length; i += 1) {
      uniquePreprints.push(`${doi}v${uniqueSpecificPreprints[i]}`);
    }
  }

  return uniquePreprints.map((versionedDoi, i) => {
    const [doi, versionIdentifier] = versionedDoi.split('v');
    return {
      versionedDoi: uniqueSpecificPreprints.length > i ? `${doi}v${uniqueSpecificPreprints[i]}` : versionedDoi,
      doi,
      versionIdentifier: uniqueSpecificPreprints.length > i ? uniqueSpecificPreprints[i] : versionIdentifier,
      date: (dates.length > i) ? dates[i] : dates[dates.length - 1],
    };
  });
};

const formatDate = (date: Date) => date.toISOString();
const evaluationUrl = (id: string) => `https://sciety.org/evaluations/hypothesis:${id}/content`;

const prepareManuscriptStructure = async (
  id: string,
  preprintVersionedDois: string[],
  preprints: string[],
  dates: Date[],
  evaluationSummary: string,
  evaluationSummaryDate: Date,
  evaluationSummaryParticipants: string[],
  peerReview?: string,
  peerReviewDate?: Date,
  authorResponse?: string,
  authorResponseDate?: Date,
) => {
  const gatheredPreprints = gatherPreprints(preprintVersionedDois, dates, preprints);
  const [preprintNotRevised] = gatheredPreprints;

  const evaluation = (reviewType: string, date: Date, participants: string[], contentUrl: string) => ({
    reviewType,
    date: formatDate(date),
    doi: `[ ${reviewType}-doi ]`,
    participants: participants.map((name) => ({
      name,
      role: 'curator',
    })),
    contentUrls: [
      contentUrl,
    ],
  });

  const version = async (
    versionId: string,
    preprintVersionedDoi: string,
    date: Date,
    versionIdentifier: string,
    versionEvaluationSummary?: string,
    versionEvaluationSummaryDate?: Date,
    versionEvaluationSummaryParticipants?: string[],
    versionPeerReview?: string,
    versionPeerReviewDate?: Date,
    versionAuthorResponse?: string,
    versionAuthorResponseDate?: Date,
    versionDoi?: string,
  ) => {
    const [preprintDoi, preprintVersionIdentifier] = preprintVersionedDoi.split('v');
    const results = await bioxriv(preprintVersionedDoi);
    const content = results.map((result) => result.content);

    return {
      id: versionId,
      doi: versionDoi || '[ version-doi ]',
      publishedDate: formatDate(date),
      versionIdentifier,
      preprint: {
        id: preprintDoi,
        doi: preprintDoi,
        ...(results.length > 0 ? { publishedDate: formatDate(results[0].date) } : {}),
        versionIdentifier: preprintVersionIdentifier,
        content,
        url: `https://www.biorxiv.org/content/${preprintVersionedDoi}`,
      },
      license: 'http://creativecommons.org/licenses/by/4.0/',
      peerReview: {
        reviews: (versionPeerReview && versionPeerReviewDate) ? [evaluation('review-article', versionPeerReviewDate, [], evaluationUrl(versionPeerReview))] : [],
        ...(
          versionEvaluationSummary && versionEvaluationSummaryDate && versionEvaluationSummaryParticipants
            ? { evaluationSummary: evaluation('evaluation-summary', versionEvaluationSummaryDate, versionEvaluationSummaryParticipants, evaluationUrl(versionEvaluationSummary)) }
            : {}
        ),
        ...(versionAuthorResponse && versionAuthorResponseDate ? { authorResponse: evaluation('author-response', versionAuthorResponseDate, [], evaluationUrl(versionAuthorResponse)) } : {}),
      },
      ...(versionPeerReview && versionPeerReviewDate ? { reviewedDate: formatDate(versionPeerReviewDate) } : {}),
      content,
      ...(versionAuthorResponse && versionAuthorResponseDate ? { authorResponseDate: formatDate(versionAuthorResponseDate) } : {}),
    };
  };

  const [reviewedPreprint, curatedPreprint] = gatheredPreprints;

  return {
    id,
    manuscript: {
      doi: '[ umbrella-doi ]',
      publishedDate: formatDate(preprintNotRevised.date),
    },
    versions: await Promise.all([
      version(
        id,
        reviewedPreprint.versionedDoi,
        reviewedPreprint.date,
        '1',
        undefined,
        undefined,
        undefined,
        peerReview,
        peerReviewDate,
      ),
      version(
        id,
        curatedPreprint.versionedDoi,
        curatedPreprint.date,
        '2',
        evaluationSummary,
        evaluationSummaryDate,
        evaluationSummaryParticipants,
        peerReview,
        peerReviewDate,
        authorResponse,
        authorResponseDate,
      ),
    ]),
  };
};

export type PrepareManuscriptData = {
  msid: string,
  overridePreprints?: string,
  datePublished: Date,
  dateRevised?: Date,
  evaluationSummaryId: string,
  peerReviewId?: string,
  authorResponseId?: string,
  doi?: string,
};

export const prepareManuscript = async (
  id: string,
  preprints: string[],
  dates: Date[],
  evaluationSummary: string,
  evaluationSummaryParticipants: string[],
  peerReview?: string,
  authorResponse?: string,
) => {
  const hypothesisDefault = {
    preprint: null,
    date: null,
    error: null,
  };

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
    hypothesis(evaluationSummary),
    ...[
      peerReview,
      authorResponse,
    ].map((evaluationId) => (evaluationId ? hypothesis(evaluationId) : hypothesisDefault)),
  ]);

  const errors = [
    evaluationSummaryError,
    peerReviewError,
    authorResponseError,
  ]
    .filter((e) => e !== null);

  if (evaluationSummary === null || evaluationSummaryDate === null || errors.length > 0) {
    if (errors.length === 0) {
      errors.push('Evaluation summary not found!');
    }
    throw new Error(errors.join(', '));
  }

  return prepareManuscriptStructure(
    id,
    [
      evaluationSummaryPreprint,
      peerReviewPreprint,
      authorResponsePreprint,
    ].filter((preprint) => preprint !== null),
    preprints,
    dates,
    evaluationSummary,
    evaluationSummaryDate,
    evaluationSummaryParticipants,
    peerReviewDate ? peerReview : undefined,
    peerReviewDate ?? undefined,
    authorResponseDate ? authorResponse : undefined,
    authorResponseDate ?? undefined,
  );
};
