declare module "@svg-maps/world" {
  const World: {
    viewBox: string;
    locations: Array<{
      id: string;
      name: string;
      path: string;
    }>;
  };

  export default World;
}
