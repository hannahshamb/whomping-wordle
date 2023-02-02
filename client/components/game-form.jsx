import React from 'react';
import Select from 'react-select';

export default class GameForm extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      characters: [],
      characterName: ''
    };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    const { name, value } = event;
    this.setState({ [name]: value });
  }

  componentDidMount() {
    fetch('https://hp-api.onrender.com/api/characters')
      .then(res => res.json())
      .then(response => {
        this.setState({ characters: response });
      });
  }

  render() {
    const { characters, characterName } = this.state;

    let placeholder = 'Type character name...';
    if (characterName !== '') {
      placeholder = characterName;
    }

    const mappedOptions = characters.map(character => {
      let imgDetails = <img className='character-img-wizard' src='../imgs/Wizard-Purple.png' alt={`${character.name}`} />;
      if (character.image !== '') {
        imgDetails = <img className='character-img-lg' src={`${character.image}`} alt={`${character.name}`} />;
      }
      return (
        { value: character.name, label: character.name, name: 'characterName', img: imgDetails }
      );
    });

    function customTheme(theme) {
      return {
        ...theme,
        colors: {
          ...theme.colors,
          primary25: '#d3a625',
          primary: '#6e85b2',
          neutral50: '#6e85b2'
        }
      };
    }

    const customStyles = {
      menu: base => ({
        ...base,
        background: 'rgb(240, 240, 240, 90%)',
        marginTop: 0
      }),
      menuList: base => ({
        ...base,
        '::-webkit-scrollbar': {
          width: '0px',
          height: '0px'
        }
      })
    };

    const formatOptionLabel = ({ value, label, img }) => {
      return (
        <div className='row d-flex align-items-center justify-content-center'>
          <div className="col-4">
            <div className='img-container'> {img}</div>
          </div>
          <div className='col p-0 d-flex justify-content-start'>{label}</div>
        </div>
      );
    };

    return (
      <div className="row position-relative" style={{ width: '500px' }}>
        <Select
          className='w-100 mx-2 text-left'
          placeholder={`${placeholder}`}
          options={mappedOptions}
          styles={customStyles}
          theme={customTheme}
          formatOptionLabel={formatOptionLabel}
          isSearchable
          maxMenuHeight="360px"
          controlShouldRenderValue={false}
          onChange={this.handleChange}
          noOptionsMessage={() => 'No characters with that name...'}
        />
        <div className="btn-absolute mx-2">
          <button className='white-btn form-font' style={{ width: '100px', height: '72px' }}>
            <i className="fa-lg fa-sharp fa-solid fa-wand-sparkles" />
          </button>
        </div>
      </div>
    );
  }

}
