const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const intializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http:localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
intializeDBAndServer();
const convertToCamelCase = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
const convertToCamelDistrict = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};
app.get("/states/", async (request, response) => {
  const getAllStates = `
    SELECT
        *
    FROM
        state;`;
  const dbResponse = await db.all(getAllStates);
  response.send(dbResponse.map((each) => convertToCamelCase(each)));
});
module.exports = app;
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateById = `
    SELECT
        *
    FROM 
        state
    WHERE
        state_id = ${stateId};`;
  const dbResponse = await db.get(getStateById);
  response.send(convertToCamelCase(dbResponse));
});
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createAdistrictTable = `
    INSERT INTO
        district (district_name,state_id,cases,cured,active,deaths)
    VALUES
       ('${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths});`;
  const dbResponse = await db.run(createAdistrictTable);
  response.send("District Successfully Added");
});
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getAdistrict = `
    SELECT
       *
    FROM
       district
    WHERE
       district_id = ${districtId};`;
  const dbResponse = await db.get(getAdistrict);
  response.send(convertToCamelDistrict(dbResponse));
});
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteADirstrict = `
    DELETE FROM
       district
    WHERE
       district_id = ${districtId};`;
  const deResponse = await db.run(deleteADirstrict);
  response.send("District Removed");
});
app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateADistrict = `
    UPDATE
       district
    SET
       district_name = '${districtName}',
       state_id = ${stateId},
       cases = ${cases},
       cured = ${cured},
       active = ${active},
       deaths = ${deaths}
    WHERE
       district_id = ${districtId};`;
  const dbResponse = await db.run(updateADistrict);
  response.send("District Details Updated");
});
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStats = `
    SELECT
       SUM(cases),
       SUM(cured),
       SUM(active),
       SUM(deaths)
    FROM
       district
    WHERE
       state_id = ${stateId};`;
  const stats = await db.get(getStats);
  console.log(stats);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDetails = `
    SELECT
        state_name
    FROM
        state JOIN district ON state.state_id = district.state_id
    WHERE
        district.district_id = ${districtId};`;
  const dbResponse = await db.get(getDetails);
  response.send({ stateName: dbResponse.state_name });
});
