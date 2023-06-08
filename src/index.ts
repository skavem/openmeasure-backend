import { Instrument, MeasurementUnit, PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  // create users
  const users = await Promise.all(
    Array.from({ length: 5 }).map(async () => {
      const username = faker.internet.userName();
      const password = faker.internet.password();
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email();
      return prisma.user.create({
        data: {
          username,
          password,
          firstName,
          lastName,
          email,
        },
      });
    })
  );

  // create operators
  const operators = await Promise.all(
    Array.from({ length: 5 }).map(async () => {
      const user = users[Math.floor(Math.random() * users.length)];
      const certificationNumber = faker.string.uuid();
      const certificationDate = faker.date.past();
      const certificationExpiryDate = faker.date.future();
      return prisma.operator.create({
        data: {
          user: { connect: { id: user.id } },
          certificationNumber,
          certificationDate,
          certificationExpiryDate,
        },
      });
    })
  );

  // create measurement units
  const measurementUnits = await Promise.all(
    Array.from({ length: 5 }).map(async () => {
      const name = faker.lorem.word();
      const symbol = faker.lorem.word();
      return prisma.measurementUnit.create({
        data: {
          name,
          symbol,
        },
      });
    })
  );

  // create instruments
  const instruments = await Promise.all(
    Array.from({ length: 5 }).map(async () => {
      const name = faker.lorem.word();
      const manufacturer = faker.company.name();
      const model = faker.lorem.word();
      const serialNumber = faker.string.uuid();
      const calibrationDate = faker.date.past();
      const calibrationDueDate = faker.date.future();
      const upperLimit = faker.number.int({ min: 10, max: 100 });
      const lowerLimit = faker.number.int({ min: 1, max: 10 });
      const resolution = faker.number.float({ min: 0.1, max: 1 });
      const accuracy = faker.number.float({ min: 0.1, max: 1 });
      const measurementRange = faker.lorem.word();
      const measurementUnit = faker.helpers.arrayElement(measurementUnits);
      const location = faker.location.city();
      const notes = faker.lorem.sentence();
      return prisma.instrument.create({
        data: {
          name,
          manufacturer,
          model,
          serialNumber,
          calibrationDate,
          calibrationDueDate,
          upperLimit,
          lowerLimit,
          resolution,
          accuracy,
          measurementRange,
          measurementUnit: { connect: { id: measurementUnit.id } },
          location,
          notes,
        },
      });
    })
  );

  // create measurement programs
  const measurementPrograms = await createMeasurementPrograms(measurementUnits, instruments);

  // create measurements
  const measurements = await Promise.all(
    Array.from({ length: 5 }).map(async () => {
      const instrument = instruments[Math.floor(Math.random() * instruments.length)];
      const program = measurementPrograms[Math.floor(Math.random() * measurementPrograms.length)];
      const operator = operators[Math.floor(Math.random() * operators.length)];
      const startedAt = faker.date.past();
      const finishedAt = faker.date.future();
      const status = faker.lorem.word();
      return prisma.measurement.create({
        data: {
          instrument: { connect: { id: instrument.id } },
          program: { connect: { id: program.id } },
          operator: { connect: { id: operator.id } },
          startedAt,
          finishedAt,
          status,
        },
      });
    })
  );

  console.log('Database seeded!');
}

async function createMeasurementPrograms(measurementUnits: MeasurementUnit[], instruments: Instrument[]) {
  const measurementPrograms = await Promise.all(
    Array.from({ length: 5 }).map(async () => {
      const name = faker.lorem.word();
      const description = faker.lorem.sentence();
      return prisma.measurementProgram.create({
        data: {
          name,
          description,
        },
      });
    })
  );

  const measurementProgramSteps = await Promise.all(
    measurementPrograms.flatMap((program) =>
      Array(3).fill(null).map(async (stepIndex) => {
        const stepName = faker.lorem.word();
        const stepDescription = faker.lorem.sentence();
        const order = stepIndex + 1 
        const targetValue = faker.number.int({ min: 10, max: 100 });
        const tolerance = faker.number.float({ min: 0.1, max: 1 });
        const usl = targetValue + tolerance;
        const lsl = targetValue - tolerance;
        const measurementUnit = faker.helpers.arrayElement(measurementUnits);
        const instrument = faker.helpers.arrayElement(instruments);
        return prisma.measurementProgramStep.create({
          data: {
            program: { connect: { id: program.id } },
            name: stepName,
            description: stepDescription,
            order,
            targetValue,
            tolerance,
            usl,
            lsl,
            measurementUnit: { connect: { id: measurementUnit.id } },
            instrument: { connect: { id: instrument.id } },
          },
        });
      })
    )
  );

  for (const [index, program] of measurementPrograms.entries()) {
    const steps = measurementProgramSteps.slice(index * 3, (index + 1) * 3);
    await prisma.measurementProgram.update({
      where: { id: program.id },
      data: {
        steps: { connect: steps.map((step) => ({ id: step.id })) },
      },
    });
  }

  return measurementPrograms;
}

main()