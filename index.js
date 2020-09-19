const express = require("express");
const cors = require("cors")

const { graphqlExpress, graphiqlExpress } = require("graphql-server-express");
const bodyParser = require("body-parser");
const { importSchema } = require("graphql-import"); //Importar un schema
const { makeExecutableSchema } = require("graphql-tools");

const port = 3000;
const endPoint = "/pizza_api";

const typeDefs = importSchema("./typeSystem.graphql");

import resolvers from "./resolvers";

const schema = makeExecutableSchema({ typeDefs, resolvers });

let server = express().use(cors());

server.use(endPoint, bodyParser.json(), graphqlExpress({ schema, rootValue: resolvers }));
server.use("/graphiql", graphiqlExpress({ endpointURL: endPoint }));

server.listen(port, () => {
    console.log("Server on Port: ", port);
    console.log("Graphql localhost:" + port + endPoint);
    console.log("Graphiql: localhost:" + port + "/graphiql");
});