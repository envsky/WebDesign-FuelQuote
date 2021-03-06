SET SCHEMA 'public';

DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS address CASCADE;
DROP TABLE IF EXISTS profile CASCADE;
DROP TABLE IF EXISTS state CASCADE;
DROP TABLE IF EXISTS fuel_quote CASCADE;

CREATE TABLE users(
  user_id VARCHAR PRIMARY KEY,
  password VARCHAR NOT NULL,
  email TEXT NOT NULL,
  last_login TIMESTAMP
);

CREATE TABLE state(
    state_code CHAR(2) PRIMARY KEY
);

CREATE TABLE address(
  address_id SERIAL PRIMARY KEY,
  address CHAR(100) NOT NULL,
  city CHAR(100) NOT NULL,
  state CHAR(2) REFERENCES state(state_code) NOT NULL,
  zipcode CHAR(9) NOT NULL
);

CREATE TABLE profile(
  profile_id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(user_id) NOT NULL,
  primary_address_id INTEGER REFERENCES address(address_id) NOT NULL,
  secondary_address_id INTEGER REFERENCES address(address_id),
  full_name VARCHAR NOT NULL
);

CREATE TABLE fuel_quote(
  fuel_quote_id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(user_id) NOT NULL,
  delivery_address TEXT,
  delivery_date TIMESTAMP,
  gallons_requested INTEGER,
  suggested_price_per_gallon NUMERIC,
  total NUMERIC
);

INSERT INTO state VALUES ('AL');
INSERT INTO state VALUES ('AK');
INSERT INTO state VALUES ('AZ');
INSERT INTO state VALUES ('AR');
INSERT INTO state VALUES ('CA');
INSERT INTO state VALUES ('CO');
INSERT INTO state VALUES ('CT');
INSERT INTO state VALUES ('DE');
INSERT INTO state VALUES ('FL');
INSERT INTO state VALUES ('GA');
INSERT INTO state VALUES ('HI');
INSERT INTO state VALUES ('ID');
INSERT INTO state VALUES ('IL');
INSERT INTO state VALUES ('IN');
INSERT INTO state VALUES ('IA');
INSERT INTO state VALUES ('KS');
INSERT INTO state VALUES ('KY');
INSERT INTO state VALUES ('LA');
INSERT INTO state VALUES ('ME');
INSERT INTO state VALUES ('MD');
INSERT INTO state VALUES ('MA');
INSERT INTO state VALUES ('MI');
INSERT INTO state VALUES ('MN');
INSERT INTO state VALUES ('MS');
INSERT INTO state VALUES ('MO');
INSERT INTO state VALUES ('MT');
INSERT INTO state VALUES ('NE');
INSERT INTO state VALUES ('NV');
INSERT INTO state VALUES ('NH');
INSERT INTO state VALUES ('NJ');
INSERT INTO state VALUES ('NM');
INSERT INTO state VALUES ('NY');
INSERT INTO state VALUES ('NC');
INSERT INTO state VALUES ('ND');
INSERT INTO state VALUES ('OH');
INSERT INTO state VALUES ('OK');
INSERT INTO state VALUES ('OR');
INSERT INTO state VALUES ('PA');
INSERT INTO state VALUES ('RI');
INSERT INTO state VALUES ('SC');
INSERT INTO state VALUES ('SD');
INSERT INTO state VALUES ('TN');
INSERT INTO state VALUES ('TX');
INSERT INTO state VALUES ('UT');
INSERT INTO state VALUES ('VT');
INSERT INTO state VALUES ('VA');
INSERT INTO state VALUES ('WA');
INSERT INTO state VALUES ('WV');
INSERT INTO state VALUES ('WI');
INSERT INTO state VALUES ('WY');
