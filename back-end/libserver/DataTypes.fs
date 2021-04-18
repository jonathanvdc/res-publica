module ResPublica.DataTypes

open Newtonsoft.Json
open System
open Microsoft.FSharp.Reflection

/// Represents a candidate. Candidates allow for a more fine-grained
/// view of a vote option's "name."
type Candidate =
    {
      /// The candidate's name.
      [<JsonProperty "name">]
      [<JsonRequired>]
      Name: string

      /// The candidate's party affiliation, if any.
      [<JsonProperty "affiliation">]
      Affiliation: string option }

type OptionId = string

/// An option in an active or historical vote.
type VoteOption =
    {
      /// A unique identifier for the option.
      [<JsonProperty "id">]
      [<JsonRequired>]
      Id: OptionId

      /// A user-friendly name for the option.
      [<JsonProperty "name">]
      [<JsonRequired>]
      Name: string

      /// Gets the list of candidates this option consists of.
      /// The first candidate is the main candidate, all others
      /// are deputies.
      ///
      /// This is an optional property that allows for a better-looking
      /// presentation of candidates in an election than the standard
      /// "name" format.
      [<JsonProperty "ticket">]
      Ticket: Candidate list option

      /// A markdown description of what this option entails.
      [<JsonProperty "description">]
      [<JsonRequired>]
      Description: string }

/// The algorithm that ballots are tallied by.
type TallyingAlgorithm =
    | FPTP
    | SPSV of Seats: int * MinScore: int * MaxScore: int
    | STAR of Seats: int * MinScore: int * MaxScore: int

type OptionRating =
    { [<JsonProperty "optionId">]
      [<JsonRequired>]
      OptionId: OptionId

      [<JsonProperty "rating">]
      [<JsonRequired>]
      Rating: int }

type BallotId = string

type Ballot =
    | ChooseOneBallot of id: BallotId * timestamp: DateTime * selectedOptionId: OptionId
    | RateOptionsBallot of id: BallotId * timestamp: DateTime * ratingPerOption: OptionRating list

/// An active or historical vote.
type Vote =
    {
      /// A unique identifier for the vote.
      [<JsonProperty "id">]
      [<JsonRequired>]
      Id: string

      /// A user-friendly name for the vote.
      [<JsonProperty "name">]
      [<JsonRequired>]
      Name: string

      /// A markdown description of what this vote is about.
      [<JsonProperty "description">]
      [<JsonRequired>]
      Description: string

      /// The point at which the vote started.
      [<JsonProperty "deadline">]
      [<JsonRequired>]
      Deadline: DateTime

      /// The vote's tallying algorithm.
      [<JsonProperty "type">]
      [<JsonRequired>]
      Algorithm: TallyingAlgorithm

      /// A list of all available options in the vote.
      [<JsonProperty "options">]
      [<JsonRequired>]
      Options: VoteOption list

      /// A list of elected candidates (represented as vote option IDs)
      /// that have resigned post-election. After a resignation, ballots
      /// must be re-tallied to elect a replacement candidate. Candidates
      /// who have been previously elected must remain elected.
      ///
      /// The list of resignations must be ordered in increasing order of
      /// resignation time.
      [<JsonProperty "resigned">]
      resigned: OptionId list }

/// A vote and all ballots cast for that vote.
type VoteAndBallots =
    {
      /// A vote.
      [<JsonProperty "vote">]
      [<JsonRequired>]
      Vote: Vote

      /// All ballots cast so far for `Vote`.
      [<JsonProperty "ballots">]
      [<JsonRequired>]
      Ballots: Ballot list

      /// The ballot cast by the user, if any.
      [<JsonProperty "ownBallot">]
      OwnBallot: Ballot option }

module Internal =
    /// A "union" format for tallying algorithm descriptions.
    type TallyingAlgorithmCatchAllFormat =
        { [<JsonProperty "type">]
          [<JsonRequired>]
          Type: string

          [<JsonProperty "positions">]
          Positions: int

          [<JsonProperty "min">]
          Min: int

          [<JsonProperty "max">]
          Max: int }

    /// A "union" format for ballots.
    type CatchAllBallotFormat =
        { [<JsonProperty "id">]
          [<JsonRequired>]
          Id: BallotId

          [<JsonProperty "timestamp">]
          [<JsonRequired>]
          Timestamp: DateTime

          [<JsonProperty "selectedOptionId">]
          SelectedOptionId: OptionId option

          [<JsonProperty "ratingPerOption">]
          RatingPerOption: OptionRating list option }

    /// A JSON converter for ballots.
    type private BallotConverter() =
        inherit JsonConverter<Ballot>()

        override this.WriteJson(writer: JsonWriter, value: Ballot, serializer: JsonSerializer) =
            let reformatted =
                match value with
                | ChooseOneBallot (id, timestamp, selectedOptionId) ->
                    Map.empty<string, obj>
                    |> Map.add "id" (id :> obj)
                    |> Map.add "timestamp" (timestamp :> obj)
                    |> Map.add "selectedOptionId" (selectedOptionId :> obj)
                    :> obj
                | RateOptionsBallot (id, timestamp, ratings) ->
                    Map.empty<string, obj>
                    |> Map.add "id" (id :> obj)
                    |> Map.add "timestamp" (timestamp :> obj)
                    |> Map.add "ratingPerOption" (ratings :> obj)
                    :> obj

            serializer.Serialize(writer, reformatted)

        override this.ReadJson
            (
                reader: JsonReader,
                _ty: Type,
                _existingValue: Ballot,
                _hasExistingValue: bool,
                serializer: JsonSerializer
            ) =
            let value =
                serializer.Deserialize<CatchAllBallotFormat> reader

            match value.SelectedOptionId, value.RatingPerOption with
            | Some optionId, None -> ChooseOneBallot(value.Id, value.Timestamp, optionId)
            | None, Some optionRatings -> RateOptionsBallot(value.Id, value.Timestamp, optionRatings)
            | _, _ -> failwithf "Ballot %A is ambiguous." value

    /// A JSON converter for tallying algorithms.
    type private TallyingAlgorithmConverter() =
        inherit JsonConverter<TallyingAlgorithm>()

        override this.WriteJson(writer: JsonWriter, value: TallyingAlgorithm, serializer: JsonSerializer) =
            let reformatted =
                match value with
                | FPTP -> Map.empty |> Map.add "type" "first-past-the-post" :> obj
                | STAR (seats, minScore, maxScore) ->
                    { Type = "spsv"
                      Positions = seats
                      Min = minScore
                      Max = maxScore }
                    :> obj
                | SPSV (seats, minScore, maxScore) ->
                    { Type = "star"
                      Positions = seats
                      Min = minScore
                      Max = maxScore }
                    :> obj

            serializer.Serialize(writer, reformatted)

        override this.ReadJson
            (
                reader: JsonReader,
                _ty: Type,
                _existingValue: TallyingAlgorithm,
                _hasExistingValue: bool,
                serializer: JsonSerializer
            ) =
            let value =
                serializer.Deserialize<TallyingAlgorithmCatchAllFormat> reader

            match value.Type with
            | "first-past-the-post" -> FPTP
            | "spsv" -> SPSV(value.Positions, value.Min, value.Max)
            | "star" -> STAR(value.Positions, value.Min, value.Max)
            | _ -> failwithf "Ill-understood tallying algorithm '%s'" value.Type

    /// Lev Gorodinski's option converter for Json.NET.
    /// Source: http://gorodinski.com/blog/2013/01/05/json-dot-net-type-converters-for-f-option-list-tuple/
    type private OptionConverter() =
        inherit JsonConverter()

        override x.CanConvert(t) =
            t.IsGenericType
            && t.GetGenericTypeDefinition() = typedefof<option<_>>

        override x.WriteJson(writer, value, serializer) =
            let value =
                if value = null then
                    null
                else
                    let _, fields =
                        FSharpValue.GetUnionFields(value, value.GetType())

                    fields.[0]

            serializer.Serialize(writer, value)

        override x.ReadJson(reader, t, existingValue, serializer) =
            let innerType = t.GetGenericArguments().[0]

            let innerType =
                if innerType.IsValueType then
                    (typedefof<Nullable<_>>)
                        .MakeGenericType([| innerType |])
                else
                    innerType

            let value =
                serializer.Deserialize(reader, innerType)

            let cases = FSharpType.GetUnionCases(t)

            if value = null then
                FSharpValue.MakeUnion(cases.[0], [||])
            else
                FSharpValue.MakeUnion(cases.[1], [| value |])

    /// A JSON converter that formats DateTime instances as fractional
    /// seconds since the Unix epoch.
    type private UnixSecondsDateTimeConverter() =
        inherit JsonConverter<DateTime>()

        override this.WriteJson(writer: JsonWriter, value: DateTime, serializer: JsonSerializer) =
            serializer.Serialize(writer, (value - DateTime.UnixEpoch).TotalSeconds)

        override this.ReadJson
            (
                reader: JsonReader,
                _ty: Type,
                _existingValue: DateTime,
                _hasExistingValue: bool,
                serializer: JsonSerializer
            ) =
            DateTime.UnixEpoch.AddSeconds(serializer.Deserialize<float> reader)

    /// A collection of converters that ensure correct serialization of
    /// Res Publica data types.
    let converters : JsonConverter array =
        [| TallyingAlgorithmConverter()
           BallotConverter()
           OptionConverter()
           UnixSecondsDateTimeConverter() |]

/// A collection of converters that ensure correct serialization of
/// Res Publica data types.
let converters = Internal.converters
