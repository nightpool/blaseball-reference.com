import apiFetcher from "lib/api-fetcher";
import { useEffect, useState } from "react";
import useSWR from "swr";

import Head from "next/head";
import { Box, Heading, Select, Skeleton, Stack } from "@chakra-ui/core";
import Layout from "components/Layout";
import StandingsTable from "components/StandingsTable";

export default function StandingsPage(props) {
  const { data: leaguesAndDivisions, leaguesAndDivisionsError } = useSWR(
    "/leaguesAndDivisions.json",
    undefined,
    {
      errorRetryCount: 5,
      initialData: props.leaguesAndDivisions,
    }
  );

  const { data: standings, standingsError } = useSWR(
    "/standings/standings.json",
    undefined,
    {
      errorRetryCount: 5,
      initialData: props.standings,
    }
  );

  return (
    <>
      <Head>
        <title>Blaseball Standings - Blaseball-Reference.com</title>
        <meta
          property="og:title"
          content="Blaseball Standings - Blaseball-Reference.com"
          key="og:title"
        />
        <meta
          name="description"
          content="Get the latest Blaseball standings from across the league. Follow your favorite team through the current season!"
        />
      </Head>
      <Layout>
        <Heading as="h1" mb={4} size="lg">
          Blaseball Standings
        </Heading>
        {standingsError || leaguesAndDivisionsError ? (
          <Box mb={4}>
            Sorry, we're currently having a siesta and couldn't load the latest
            standings.
          </Box>
        ) : null}
        <Standings
          leaguesAndDivisions={leaguesAndDivisions}
          standings={standings}
        />
      </Layout>
    </>
  );
}

function Standings({ leaguesAndDivisions, standings }) {
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [seasonList, setSeasonList] = useState([]);

  useEffect(() => {
    setSeasonList([
      ...(standings
        ? Object.keys(standings).sort((a, b) => Number(a) - Number(b))
        : []),
    ]);
  }, [standings]);

  useEffect(() => {
    if (seasonList.length > 0) {
      setSelectedSeason(seasonList[seasonList.length - 1]);
    }
  }, [seasonList]);

  const handleSelectChange = (evt) => {
    setSelectedSeason(evt.target.value);
  };

  if (
    !leaguesAndDivisions ||
    !Object.hasOwnProperty.call(standings, selectedSeason) ||
    !standings
  ) {
    return (
      <>
        <Select
          fontSize={{ base: "lg", md: "md" }}
          isDisabled={true}
          maxWidth="2xs"
          mb={4}
          placeholder="Loading..."
          size="md"
        />
        <Stack>
          <Skeleton height="20px" />
          <Skeleton height="20px" />
          <Skeleton height="20px" />
        </Stack>
      </>
    );
  }

  return (
    <>
      <Select
        fontSize={{ base: "lg", md: "md" }}
        maxWidth="2xs"
        mb={4}
        onChange={handleSelectChange}
        size="md"
        value={selectedSeason}
      >
        {seasonList.map((season) => (
          <option key={season} value={season}>
            {`Season ${Number(season) + 1}`}
          </option>
        ))}
      </Select>

      {Object.entries(standings[selectedSeason]).map(
        ([divisionId, divisionTeams]) => (
          <React.Fragment key={divisionId}>
            <StandingsTable
              division={leaguesAndDivisions.divisions.find(
                (division) => division.id === divisionId
              )}
              divisions={leaguesAndDivisions.divisions.filter((division) => {
                return Object.keys(standings[selectedSeason]).includes(
                  division.id
                );
              })}
              season={selectedSeason}
              standings={standings[selectedSeason][divisionId]}
            />
          </React.Fragment>
        )
      )}
    </>
  );
}

export async function getStaticProps({ params, preview = false }) {
  let standings = null;
  let leaguesAndDivisions = null;

  try {
    standings = await apiFetcher("/standings/standings.json");
    leaguesAndDivisions = await apiFetcher("/leaguesAndDivisions.json");
  } catch (error) {
    console.log(error);
  }

  return {
    props: {
      leaguesAndDivisions,
      standings,
      preview,
    },
    revalidate: 180,
  };
}
