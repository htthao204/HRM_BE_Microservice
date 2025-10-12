import express from "express";

export const bodyParser = [
  express.json(),
  express.urlencoded({ extended: true }),
];
