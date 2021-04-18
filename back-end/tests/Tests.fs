module Tests

open System
open Xunit
open Newtonsoft.Json
open System.IO
open ResPublica.DataTypes

let serializer =
    let settings = JsonSerializerSettings()

    for conv in converters do
        settings.Converters.Add conv

    JsonSerializer.Create settings

let serialize value =
    use writer = new StringWriter()
    serializer.Serialize(writer, value)
    writer.ToString()

let deserialize<'a> text =
    use reader = new StringReader(text)
    serializer.Deserialize(reader, typeof<'a>) :?> 'a

let assertRoundTrip<'a> (value: 'a) =
    Assert.Equal(value, value |> serialize |> deserialize<'a>)

[<Fact>]
let ``Choose-One Ballot Serializes`` () =
    Assert.Equal(
        ChooseOneBallot("hi", DateTime.UnixEpoch, "howdy")
        |> serialize,
        """{"id":"hi","selectedOptionId":"howdy","timestamp":0.0}"""
    )

[<Fact>]
let ``Choose-One Ballot Round Trips`` () =
    ChooseOneBallot("hi", DateTime.UnixEpoch, "howdy")
    |> assertRoundTrip

[<Fact>]
let ``Rate-Options Ballot Serializes`` () =
    Assert.Equal(
        RateOptionsBallot("hi", DateTime.UnixEpoch, [ { OptionId = "howdy"; Rating = 4 } ])
        |> serialize,
        """{"id":"hi","ratingPerOption":[{"optionId":"howdy","rating":4}],"timestamp":0.0}"""
    )

[<Fact>]
let ``Rate-Options Ballot Round Trips`` () =
    RateOptionsBallot("hi", DateTime.UnixEpoch, [ { OptionId = "howdy"; Rating = 4 } ])
    |> assertRoundTrip
