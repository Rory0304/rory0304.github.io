"use client";

import React from "react";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import RssFeedIcon from "@mui/icons-material/RssFeed";
import Link from "next/link";

const Footer: React.FC = () => {
  return (
    <footer>
      <Box bgcolor="whitesmoke" paddingX={3} paddingY={5}>
        <Container maxWidth="md">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="body2">
              © 2023 Rory. All rights reserved.
            </Typography>
            <Link href="/rss.xml">
              <RssFeedIcon />
            </Link>
          </Stack>
        </Container>
      </Box>
    </footer>
  );
};

export default Footer;
