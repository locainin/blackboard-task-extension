import React from 'react';
import { FallbackProps } from 'react-error-boundary';
import styled from 'styled-components';
import { SUPPORT_URL } from '../../constants';

const ErrorWrapper = styled.div`
  padding: 10px 0px;
`;

const ErrorDiv = styled.div`
  color: #ef4444;
  padding: 10px;
`;

const SupportLink = styled.a`
  font-weight: bold;
`;

export default function ErrorRender({
  error,
}: Partial<FallbackProps>): JSX.Element {
  const message = error?.message || 'Unknown error';
  const blackboardError = message.includes('Blackboard');
  const failureTitle = blackboardError
    ? 'Tasks for Blackboard could not read Blackboard data.'
    : 'Tasks for Blackboard failed to load.';
  const failureMessage = blackboardError
    ? 'Blackboard may have returned a sign-in page, an XML error page, or blocked API data. Refresh Blackboard, confirm the session is still active, and try again. If it keeps happening, include the error below in a support request:'
    : 'Sorry about that! If this keeps happening, please submit a support request and include the following error message:';
  const supportText = 'Support Link';
  return (
    <ErrorWrapper id="tfc-fail-load">
      <strong>{failureTitle}</strong>
      <br />
      {failureMessage}
      <ErrorDiv>{message}</ErrorDiv>
      <SupportLink
        href={`${SUPPORT_URL}?title=Blackboard%20load%20failure`}
        target="_blank"
      >
        {supportText}
      </SupportLink>
    </ErrorWrapper>
  );
}
