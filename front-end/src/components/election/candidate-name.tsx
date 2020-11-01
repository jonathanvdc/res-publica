import React, { ReactNode } from "react";
import { VoteOption } from "../../model/vote";
import Ticket from "./ticket";

export function renderCandidateName(candidate: VoteOption): ReactNode {
    if (candidate.ticket) {
        return <Ticket candidates={candidate.ticket} />;
    } else {
        return candidate.name;
    }
}
